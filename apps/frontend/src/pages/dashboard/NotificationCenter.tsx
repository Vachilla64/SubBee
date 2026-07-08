import TopBar from '../../components/layout/TopBar';
import EmptyState from '../../components/ui/EmptyState';

export default function NotificationCenter() {
  return (
    <div>
      <TopBar title="Notifications" back />
      <div className="px-5">
        <EmptyState
          mascot="/illustrations/bee-happy.png"
          title="You're all caught up"
          message="Reminders, receipts, and status changes will show up here as they happen."
        />
      </div>
    </div>
  );
}
