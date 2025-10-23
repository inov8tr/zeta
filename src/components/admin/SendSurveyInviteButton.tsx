"use client";

import { useState, useTransition } from "react";
import { sendSurveyInviteAction } from "@/app/(server)/survey-actions";
import { Button } from "@/components/ui/Button";

type Props = {
  studentId: string;
  parentEmail: string | null;
  studentName: string | null;
  revalidatePath?: string;
};

const SendSurveyInviteButton = ({ studentId, parentEmail, studentName, revalidatePath }: Props) => {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    setMessage(null);
    if (!parentEmail) {
      setMessage("학부모 이메일이 없어 초대장을 보낼 수 없습니다.");
      return;
    }

    startTransition(async () => {
      const result = await sendSurveyInviteAction({
        studentId,
        parentEmail,
        studentName,
        revalidate: revalidatePath,
      });
      if (!result.ok) {
        setMessage(result.error ?? "설문 초대 이메일 전송에 실패했습니다.");
      } else {
        setMessage("설문 초대 이메일을 전송했습니다.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" onClick={handleClick} disabled={pending} size="sm" variant="outline">
        {pending ? "전송 중…" : "Survey Invite 보내기"}
      </Button>
      {message ? <span className="text-xs text-neutral-600">{message}</span> : null}
    </div>
  );
};

export default SendSurveyInviteButton;
