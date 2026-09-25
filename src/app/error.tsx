"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container section narrow">
      <h1>Chưa thể tải nội dung</h1>
      <p>
        Vui lòng thử lại. Nếu bạn vừa cài đặt, kiểm tra cấu hình cơ sở dữ liệu
        trong README.
      </p>
      <button className="button" onClick={reset}>
        Thử lại
      </button>
    </main>
  );
}
