import { ApiClientError } from "@/lib/frontend/api";

type UploadResponse = {
  data?: {
    url: string;
  };
  error?: {
    code: string;
    message: string;
  };
};

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads/image", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as UploadResponse;
  if (!response.ok || !payload.data?.url) {
    throw new ApiClientError(response.status || 500, {
      code: payload.error?.code ?? "INTERNAL_ERROR",
      message: payload.error?.message ?? "Не удалось загрузить изображение.",
    });
  }

  return payload.data.url;
}
