import { errorMessage } from '../api/client';

export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="center-box">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return <div className="error-box">⚠️ {errorMessage(error)}</div>;
}

export function Empty({ label = 'Không có dữ liệu' }: { label?: string }) {
  return <div className="empty">{label}</div>;
}
