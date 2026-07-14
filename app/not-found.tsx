import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-foreground/5 rounded-lg border border-gray-100 p-10 text-center dark:border-gray-800">
      <h2 className="text-base font-semibold">경로를 찾지 못했습니다</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        요청하신 경로를 찾을 수 없습니다. 주소를 확인하거나, 저장된 바구니를 비우고 처음부터 다시 시작해 보세요.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="bg-foreground text-background hover:bg-foreground/85 rounded-md px-4 py-2 text-sm font-medium"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
