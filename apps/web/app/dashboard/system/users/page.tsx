import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { toggleApproval, resetPassword, makeAdmin } from '@/app/lib/actions/system';
import { isPlatformOwner } from '@/app/lib/auth/platform';

export default async function Page() {
    const session = await auth();
    if (!isPlatformOwner(session)) {
        redirect('/dashboard');
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            admin: { select: { name: true } }
        }
    });

    return (
        <div className="w-full">
            <h1 className="mb-8 text-2xl font-bold">System Admin: All Users (Global)</h1>

            <div className="rounded-md border bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="px-4 py-3 font-medium">Name / Email</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium">Org / Admin</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {user.role === 'ADMIN' ? (
                                        <span className="text-gray-400">Is Tenant</span>
                                    ) : (
                                        user.admin?.name || <span className="text-red-500">Orphan</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {user.approved ? 'Approved' : 'Pending'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <form action={toggleApproval.bind(null, user.id, user.approved)}>
                                            <button className="rounded border bg-white px-2 py-1 hover:bg-gray-50">
                                                {user.approved ? 'Block' : 'Approve'}
                                            </button>
                                        </form>
                                        <form action={resetPassword.bind(null, user.id)}>
                                            <button className="rounded border bg-white px-2 py-1 text-orange-600 hover:bg-orange-50">
                                                Reset Pwd
                                            </button>
                                        </form>
                                        {user.role !== 'ADMIN' && (
                                            <form action={makeAdmin.bind(null, user.id)}>
                                                <button className="rounded border bg-white px-2 py-1 text-purple-600 hover:bg-purple-50">
                                                    Promote to Client
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
