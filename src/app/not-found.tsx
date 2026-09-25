import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container section narrow">
      <span className="eyebrow">404 · KHÔNG TÌM THẤY</span>
      <h1>Hành trình này chưa có trên NOI</h1>
      <p>Đường dẫn có thể đã thay đổi hoặc nội dung chưa được công khai.</p>
      <Link className="button" href="/chien-dich">
        Khám phá chiến dịch
      </Link>
    </main>
  );
}
