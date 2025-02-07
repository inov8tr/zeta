import Image from "next/image";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Program {
  name: string;
  description: string;
  image: string;
  href: string;
}

export default function ProgramCard({ program }: { program: Program }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl">
      <div className="aspect-h-2 aspect-w-3 overflow-hidden">
        <Image
          src={program.image || "/placeholder.svg"}
          alt={program.name}
          width={600}
          height={400}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900">{program.name}</h3>
        <p className="mt-2 text-gray-600">{program.description}</p>
        <Button asChild variant="link" className="mt-4 p-0 text-brand-blue hover:text-brand-blue/80">
          <Link href={program.href}>
            Learn more <span aria-hidden="true">→</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
