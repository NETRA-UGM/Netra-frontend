export const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export const sessionCookie = "netra_session";

export type NetraUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};
