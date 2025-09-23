export default async function uploadToCloudinary(file) {
  const cloudName = "dze5gi1ft"; // seu cloud_name
  const uploadPreset = "uhadthkk"; // preset NÃO-ASSINADO

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Erro no upload");
  return data.secure_url;
}
