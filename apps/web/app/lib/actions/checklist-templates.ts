"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import type { ChecklistFieldType, PhotoRequirement } from "@prisma/client";

async function assertOwnerOfTemplate(id: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const tpl = await prisma.checklistTemplate.findFirst({
    where: { id, ownerId: orgId },
    select: { id: true },
  });
  if (!tpl) throw new Error("Template not found");
  return orgId;
}

export async function createTemplate(formData: FormData) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  const description = ((formData.get("description") as string) ?? "").trim() || null;
  const locationId = ((formData.get("locationId") as string) ?? "").trim() || null;

  if (!name) throw new Error("Name required");
  if (locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: locationId, ownerId: orgId },
    });
    if (!loc) throw new Error("Invalid location");
  }

  const tpl = await prisma.checklistTemplate.create({
    data: { name, description, locationId, ownerId: orgId },
  });
  revalidatePath("/dashboard/tasks/templates");
  redirect(`/dashboard/tasks/templates/${tpl.id}`);
}

export async function updateTemplate(id: string, formData: FormData) {
  const orgId = await assertOwnerOfTemplate(id);
  const name = (formData.get("name") as string)?.trim();
  const description = ((formData.get("description") as string) ?? "").trim() || null;
  const locationId = ((formData.get("locationId") as string) ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: locationId, ownerId: orgId },
    });
    if (!loc) throw new Error("Invalid location");
  }

  await prisma.checklistTemplate.update({
    where: { id },
    data: { name, description, locationId, isActive },
  });
  revalidatePath("/dashboard/tasks/templates");
  revalidatePath(`/dashboard/tasks/templates/${id}`);
}

export async function deleteTemplate(id: string) {
  await assertOwnerOfTemplate(id);
  await prisma.checklistTemplate.delete({ where: { id } });
  revalidatePath("/dashboard/tasks/templates");
  redirect("/dashboard/tasks/templates");
}

export async function addField(
  templateId: string,
  data: {
    type: ChecklistFieldType;
    name: string;
    description?: string | null;
    exampleImageUrl?: string | null;
    photoRequirement?: PhotoRequirement;
  },
) {
  await assertOwnerOfTemplate(templateId);
  const last = await prisma.checklistField.findFirst({
    where: { templateId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (last?.order ?? -1) + 1;
  const created = await prisma.checklistField.create({
    data: {
      templateId,
      order,
      type: data.type,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      exampleImageUrl: data.exampleImageUrl || null,
      photoRequirement: data.photoRequirement ?? "NONE",
    },
  });
  revalidatePath(`/dashboard/tasks/templates/${templateId}`);
  return created;
}

export async function updateField(
  fieldId: string,
  data: {
    type: ChecklistFieldType;
    name: string;
    description?: string | null;
    exampleImageUrl?: string | null;
    photoRequirement?: PhotoRequirement;
  },
) {
  const field = await prisma.checklistField.findUnique({
    where: { id: fieldId },
    select: { templateId: true },
  });
  if (!field) throw new Error("Field not found");
  await assertOwnerOfTemplate(field.templateId);
  await prisma.checklistField.update({
    where: { id: fieldId },
    data: {
      type: data.type,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      exampleImageUrl: data.exampleImageUrl || null,
      photoRequirement: data.photoRequirement ?? "NONE",
    },
  });
  revalidatePath(`/dashboard/tasks/templates/${field.templateId}`);
}

export async function deleteField(fieldId: string) {
  const field = await prisma.checklistField.findUnique({
    where: { id: fieldId },
    select: { templateId: true },
  });
  if (!field) throw new Error("Field not found");
  await assertOwnerOfTemplate(field.templateId);
  await prisma.checklistField.delete({ where: { id: fieldId } });
  revalidatePath(`/dashboard/tasks/templates/${field.templateId}`);
}

export async function reorderFields(templateId: string, orderedFieldIds: string[]) {
  await assertOwnerOfTemplate(templateId);
  await prisma.$transaction(
    orderedFieldIds.map((id, idx) =>
      prisma.checklistField.update({ where: { id }, data: { order: idx } }),
    ),
  );
  revalidatePath(`/dashboard/tasks/templates/${templateId}`);
}
