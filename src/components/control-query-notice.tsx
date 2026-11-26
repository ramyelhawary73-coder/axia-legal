import { RefreshCw } from "lucide-react";
import styles from "@/components/platform-workspace.module.css";

export function ControlQueryNotice({ loading, error, retry, label }: { loading: boolean; error: string; retry: () => void; label: string }) {
  if (loading) return <p role="status" className={styles.notice}>جارٍ تحميل {label}…</p>;
  if (!error) return null;
  return <div role="alert" className={styles.notice}><p>{error}</p><button type="button" onClick={retry} className={`${styles.button} mt-3`}><RefreshCw size={16} aria-hidden="true" />إعادة تحميل {label}</button></div>;
}
