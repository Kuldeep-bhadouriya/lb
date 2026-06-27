export async function apiFetch(
  url: string,
  options: any = {},
  timeout = 15000,
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });

    const text = await res.text();

    if (
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html")
    ) {
      throw {
        status: res.status,
        message: "Server error. Please try again.",
      };
    }

    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: text };
    }

    return data;
  } catch (err: any) {
    if (err.name === "AbortError") {
      return Promise.reject({ status: 408, message: "Request timed out" });
    }
    return Promise.reject({
      status: err.status || 500,
      message: err.message || "Something went wrong.",
    });
  } finally {
    clearTimeout(id);
  }
}
