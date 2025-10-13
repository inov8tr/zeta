import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import AssessmentRunner from "@/components/assessment/AssessmentRunner";
import { Database } from "@/lib/database.types";

interface AssessmentPageProps {
  params: Promise<{ testId: string }>;
}

type AssessmentTestRow = Pick<
  Database["public"]["Tables"]["tests"]["Row"],
  "id" | "student_id" | "status"
>;

const AssessmentPage = async ({ params }: AssessmentPageProps) => {
  const { testId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: test, error } = await supabase
    .from("tests")
    .select("id, student_id, status")
    .eq("id", testId)
    .maybeSingle<AssessmentTestRow>();

  if (error || !test) {
    redirect("/student");
  }

  const testRow = test as AssessmentTestRow;

  if (testRow.student_id !== session.user.id) {
    redirect("/student");
  }

  return (
    <AssessmentRunner
      testId={testId}
      initialStatus={testRow.status}
      studentId={session.user.id}
    />
  );
};

export default AssessmentPage;
