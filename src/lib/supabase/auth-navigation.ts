export function safeNextPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  )
    return "/";

  try {
    const url = new URL(value, "https://axia.invalid");
    const pathname = decodeURIComponent(url.pathname);
    if (
      url.origin !== "https://axia.invalid" ||
      pathname.startsWith("//") ||
      /[\\\u0000-\u001f\u007f]/.test(pathname) ||
      pathname === "/login" ||
      pathname.startsWith("/login/")
    )
      return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function loginErrorMessage(code: unknown): string | null {
  switch (code) {
    case "missing_credentials":
      return "أدخل البريد الإلكتروني وكلمة المرور.";
    case "invalid_credentials":
      return "تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.";
    case "rate_limited":
      return "تمت محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.";
    case "auth_unavailable":
      return "خدمة الدخول غير متاحة مؤقتًا. يرجى المحاولة لاحقًا أو التواصل مع مسؤول النظام.";
    default:
      return null;
  }
}
