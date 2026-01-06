"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <Link href={"/"} />;
}
