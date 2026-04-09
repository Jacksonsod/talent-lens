"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UploadRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/jobs/${id}/applicants`);
  }, [id, router]);

  return null;
}
