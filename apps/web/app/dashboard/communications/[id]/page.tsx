import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { getViewerContext } from "@/app/lib/auth/viewer";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  changeCommunicationStatus,
  deleteCommunication,
} from "@/app/lib/actions/communications";
import CommentComposer from "@/app/ui/communications/comment-composer";

export default async function CommunicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const c = await prisma.communication.findFirst({
    where: { id, businessId: orgId },
    include: {
      author: { select: { name: true } },
      location: { select: { name: true } },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!c) notFound();

  // Mismo criterio que la lista: el trabajador sólo abre comunicaciones en las
  // que participa; el encargado, además las de sus locales.
  const viewer = await getViewerContext();
  if (!viewer.isManager) {
    const uid = viewer.userId ?? "";
    const involved =
      c.authorId === uid || c.assigneeIds.includes(uid) || c.followerIds.includes(uid);
    const inScope =
      viewer.isSupervisor &&
      (viewer.locationIds.length === 0 ||
        !c.locationId ||
        viewer.locationIds.includes(c.locationId));
    if (!involved && !inScope) notFound();
  }

  const setOpen = changeCommunicationStatus.bind(null, c.id, "OPEN");
  const setInProgress = changeCommunicationStatus.bind(null, c.id, "IN_PROGRESS");
  const setClosed = changeCommunicationStatus.bind(null, c.id, "CLOSED");
  const del = deleteCommunication.bind(null, c.id);

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard/communications"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{c.type}</p>
            <h1 className="text-xl font-semibold text-gray-800 mt-1">{c.title}</h1>
          </div>
          <span
            className={clsx(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              c.status === "OPEN"
                ? "bg-blue-100 text-blue-700"
                : c.status === "IN_PROGRESS"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600",
            )}
          >
            {c.status === "OPEN"
              ? "Abierta"
              : c.status === "IN_PROGRESS"
                ? "En curso"
                : "Cerrada"}
          </span>
        </div>
        {c.description && (
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{c.description}</p>
        )}
        {c.photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {c.photoUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt=""
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:opacity-90"
                />
              </a>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-4 flex items-center gap-2 flex-wrap">
          <span>Por <span className="font-medium">{c.author.name}</span></span>
          {c.location && (
            <>
              <span>·</span>
              <span>{c.location.name}</span>
            </>
          )}
          <span>·</span>
          <span>{new Date(c.createdAt).toLocaleString("es-ES")}</span>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {c.status !== "IN_PROGRESS" && (
            <form action={setInProgress}>
              <button className="text-xs px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg inline-flex items-center gap-1">
                <PlayCircleIcon className="w-3.5 h-3.5" />
                En curso
              </button>
            </form>
          )}
          {c.status !== "CLOSED" && (
            <form action={setClosed}>
              <button className="text-xs px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg inline-flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Cerrar
              </button>
            </form>
          )}
          {c.status === "CLOSED" && (
            <form action={setOpen}>
              <button className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg">
                Reabrir
              </button>
            </form>
          )}
          <Link
            href={`/dashboard/communications/${c.id}/edit`}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
          >
            Editar
          </Link>
          <form action={del}>
            <button className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg inline-flex items-center gap-1">
              <XMarkIcon className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </form>
        </div>
      </div>

      {/* Timeline */}
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        Comentarios ({c.comments.length})
      </h2>
      <div className="space-y-2 mb-4">
        {c.comments.length === 0 && (
          <p className="text-sm text-gray-400 italic">Aún no hay comentarios.</p>
        )}
        {c.comments.map((cm) => (
          <div key={cm.id} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-700">{cm.author.name}</p>
              <p className="text-xs text-gray-400">
                {new Date(cm.createdAt).toLocaleString("es-ES")}
              </p>
            </div>
            {cm.body && (
              <p className="text-sm text-gray-700 whitespace-pre-line">{cm.body}</p>
            )}
            {cm.photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {cm.photos.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <CommentComposer communicationId={c.id} />
    </div>
  );
}
