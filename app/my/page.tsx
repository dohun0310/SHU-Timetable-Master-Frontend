import MyTimetables from "@/components/MyTimetables";

/** 저장된 시간표는 브라우저에만 있다. 백엔드가 죽어도 열람할 수 있도록 서버에서 아무것도 부르지 않는다. */
export default function MyPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">내 시간표</h1>
      <MyTimetables />
    </div>
  );
}
