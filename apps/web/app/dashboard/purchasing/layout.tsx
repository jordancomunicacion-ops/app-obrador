export default function PurchasingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
