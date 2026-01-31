'use client';

import { PlusIcon, PlayIcon, CheckIcon, ExclamationCircleIcon, ArrowRightIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { updateTaskStatus, assignAndStartTask, assignTask, reportTaskIssue } from '@/app/lib/actions/tasks';
import { generateAllProductionTasks } from '@/app/lib/actions/events';
import { useTransition, useState } from 'react';
import { User } from '@prisma/client';
import TaskAssignmentModal from './assignment-modal';
import IssueModal from './issue-modal';

export function CreateTask() {
    return (
        <Link
            href="/dashboard/tasks/create"
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            <span className="hidden md:block">Nueva Tarea</span>
            <PlusIcon className="h-5 md:ml-4" />
        </Link>
    );
}

interface TaskStatusButtonProps {
    id: string;
    status: string;
    currentStatus: string;
    users?: User[];
    taskTitle?: string;
    isAssigned?: boolean;
}

export function TaskStatusButton({ id, status, currentStatus, users = [], taskTitle = '', isAssigned = false }: TaskStatusButtonProps) {
    const update = updateTaskStatus.bind(null, id, status);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

    // Don't show button if already in that status
    if (status === currentStatus) return null;

    let icon = <ArrowRightIcon className="w-4 h-4" />;
    let label = "Mover";
    let bgClass = "bg-gray-100 text-gray-600 hover:bg-gray-200";

    const isStartButton = status === 'IN_PROGRESS';
    const isIssueButton = status === 'ISSUE';

    if (isStartButton) {
        icon = <PlayIcon className="w-4 h-4" />;
        label = "Empezar";
        bgClass = "bg-blue-100 text-blue-600 hover:bg-blue-200";
    } else if (status === 'DONE') {
        icon = <CheckIcon className="w-4 h-4" />;
        label = "Completar";
        bgClass = "bg-green-100 text-green-600 hover:bg-green-200";
    } else if (status === 'ISSUE') {
        icon = <ExclamationCircleIcon className="w-4 h-4" />;
        label = "Problema";
        bgClass = "bg-red-100 text-red-600 hover:bg-red-200";
    } else if (status === 'PENDING') {
        icon = <ArrowPathIcon className="w-4 h-4" />;
        label = "Reiniciar";
        bgClass = "bg-yellow-100 text-yellow-600 hover:bg-yellow-200";
    }

    const handleClick = (e: React.MouseEvent) => {
        if (isStartButton) {
            if (!isAssigned) {
                // If not assigned, show assignment modal (legacy or admin fallback)
                e.preventDefault();
                setIsAssignmentModalOpen(true);
            }
            // If assigned, let the form action run (update status directly)
        } else if (isIssueButton) {
            e.preventDefault();
            setIsIssueModalOpen(true);
        }
    };

    const handleConfirmAssignment = async (userId: string, date: string, time: string, duration: number) => {
        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        await assignAndStartTask(id, userId, startDateTime, endDateTime);
        setIsAssignmentModalOpen(false);
    };

    const handleConfirmIssue = async (reason: string) => {
        await reportTaskIssue(id, reason);
        setIsIssueModalOpen(false);
    };

    return (
        <>
            <form action={update}>
                <button
                    onClick={handleClick}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${bgClass}`}
                    title={label}
                >
                    {icon} <span className="hidden sm:inline">{label}</span>
                </button>
            </form>

            {isStartButton && (
                <TaskAssignmentModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    onConfirm={handleConfirmAssignment}
                    users={users}
                    taskTitle={taskTitle}
                />
            )}

            {isIssueButton && (
                <IssueModal
                    isOpen={isIssueModalOpen}
                    onClose={() => setIsIssueModalOpen(false)}
                    onConfirm={handleConfirmIssue}
                    taskTitle={taskTitle}
                />
            )}
        </>
    );
}

export function AssignTaskButton({ id, users, taskTitle }: { id: string, users: User[], taskTitle: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAssignClick = () => {
        setIsModalOpen(true);
    };

    const handleConfirmAssignment = async (userId: string, date: string, time: string, duration: number) => {
        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        await assignTask(id, userId, startDateTime, endDateTime);
        setIsModalOpen(false);
    };

    return (
        <>
            <button
                onClick={handleAssignClick}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-purple-100 text-purple-600 hover:bg-purple-200"
                title="Asignar"
            >
                <UserIcon className="w-4 h-4" /> <span className="hidden sm:inline">Asignar</span>
            </button>

            <TaskAssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAssignment}
                users={users}
                taskTitle={taskTitle}
                title="Asignar Tarea"
                confirmLabel="Confirmar Asignación"
            />
        </>
    );
}

export function GenerateWeeklyProduction() {
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        startTransition(async () => {
            const result = await generateAllProductionTasks();
            if (result.message) {
                alert(result.message);
            }
        });
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex h-10 items-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
        >
            <span className="hidden md:block">Generar Producción Semanal</span>
            {isPending ? (
                <ArrowPathIcon className="h-5 md:ml-4 animate-spin" />
            ) : (
                <ArrowPathIcon className="h-5 md:ml-4" />
            )}
        </button>
    );
}
