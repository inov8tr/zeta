"use client";

import { useState, useTransition } from "react";
import { ensureSurveyTokenAction } from "@/app/(server)/survey-actions";
import { Button } from "@/components/ui/Button";

type Props = {
  studentId: string;
  hasSurvey: boolean;
};

const EditSurveyButton = ({ studentId, hasSurvey }: Props) => {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await ensureSurveyTokenAction({ studentId });
      if (!res?.ok || !res.link) {
        setMessage(res?.error ?? "설문 링크를 생성하지 못했습니다.");
        return;
      }
      window.location.href = res.link;
    });
  };

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <Button type="button" size="sm" variant="outline" onClick={handleClick} disabled={pending}>
        {pending ? "열기..." : hasSurvey ? "설문 편집" : "설문 작성"}
      </Button>
      {message ? <span className="text-xs text-red-600">{message}</span> : null}
    </div>
  );
};

export default EditSurveyButton;
