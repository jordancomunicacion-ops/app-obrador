import EventsTable from '@/app/ui/events/table';
import { CreateEvent } from '@/app/ui/events/buttons';
import { Suspense } from 'react';
import PageHeader from '@/app/ui/primitives/page-header';
import { CalendarIcon } from '@heroicons/react/24/outline';

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
    }>;
}) {
    const params = await searchParams;
    const query = params?.query || '';
    const currentPage = Number(params?.page) || 1;

    return (
        <div className="w-full">
            <PageHeader
                icon={<CalendarIcon className="w-6 h-6" />}
                title="Gestión de eventos"
                actions={<CreateEvent />}
            />
            <Suspense fallback={<div>Cargando eventos...</div>}>
                <EventsTable query={query} currentPage={currentPage} />
            </Suspense>
        </div>
    );
}
