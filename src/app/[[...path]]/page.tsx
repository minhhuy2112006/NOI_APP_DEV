import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getData } from "@/lib/data";
import { Header, Footer, WorkspaceShell } from "@/components/shell";
import {
  Home,
  CampaignList,
  CampaignDetail,
  PublicPage,
} from "@/components/public-pages";
import { Personal, Organization, Admin } from "@/components/workspaces";
import { AuthScreen } from "@/components/auth-screen";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const p = (await params).path || [];
  const privatePage =
    ["ca-nhan", "quan-tri", "dang-nhap"].includes(p[0]) ||
    (p[0] === "to-chuc" && p[1] === "quan-ly");
  return { robots: privatePage ? { index: false, follow: false } : undefined };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { path: parts = [] } = await params;
  const path = "/" + parts.join("/");
  const data = await getData();
  if(parts[0]==="to-chuc"&&parts.length===2&&parts[1]!=="quan-ly"&&!data.organizations.some(o=>o.slug===parts[1]))notFound();
  let content: React.ReactNode;
  const workspace =
    path.startsWith("/ca-nhan") ||
    path.startsWith("/to-chuc/quan-ly") ||
    path.startsWith("/quan-tri");
  if (workspace) {
    const privatePaths=['/ca-nhan','/ca-nhan/dang-ky','/ca-nhan/diem-danh','/ca-nhan/quyen-gop','/ca-nhan/diem-phuoc','/ca-nhan/thong-bao','/ca-nhan/ho-so','/ca-nhan/ho-tro','/to-chuc/quan-ly','/to-chuc/quan-ly/chien-dich','/to-chuc/quan-ly/ung-vien','/to-chuc/quan-ly/diem-danh','/to-chuc/quan-ly/tai-chinh','/to-chuc/quan-ly/bao-cao','/to-chuc/quan-ly/ho-so','/to-chuc/quan-ly/ho-tro','/quan-tri','/quan-tri/to-chuc','/quan-tri/chien-dich','/quan-tri/tai-chinh','/quan-tri/noi-dung','/quan-tri/bao-cao','/quan-tri/qua','/quan-tri/phan-anh','/quan-tri/nhat-ky'];
    if(!privatePaths.includes(path))notFound();
    if (!data.user) redirect("/dang-nhap?next=" + encodeURIComponent(path));
    if (path.startsWith("/quan-tri") && data.user.role !== "admin")
      redirect("/ca-nhan");
    if (path.startsWith("/to-chuc/quan-ly") && data.user.role !== "organizer")
      redirect("/ca-nhan");
    content = (
      <WorkspaceShell user={data.user}>
        {path.startsWith("/quan-tri") ? (
          <Admin data={data} path={path} />
        ) : path.startsWith("/to-chuc/quan-ly") ? (
          <Organization data={data} path={path} />
        ) : (
          <Personal data={data} path={path} />
        )}
      </WorkspaceShell>
    );
  } else if (path === "/") content = <Home data={data} />;
  else if (path === "/dang-nhap")
    content = (
      <Suspense fallback={<p>Đang tải…</p>}>
        <AuthScreen mode={data.mode} />
      </Suspense>
    );
  else if (path === "/chien-dich" || path === "/co-hoi-tinh-nguyen")
    content = (
      <CampaignList
        data={data}
        initialCategory={(await searchParams)["linh-vuc"]}
      />
    );
  else if (parts[0] === "chien-dich" && parts.length === 2) {
    const c = data.campaigns.find((c) => c.slug === parts[1]);
    if (!c) notFound();
    content = <CampaignDetail data={data} c={c} />;
  } else if (
    [
      "/to-chuc",
      "/gioi-thieu",
      "/minh-bach",
      "/diem-phuoc",
      "/bao-cao-tac-dong",
      "/noi-for-business",
      "/thung-dong-hanh",
      "/ho-tro-khan-cap",
      "/tro-giup",
      "/lien-he",
      "/chinh-sach",
      "/cau-chuyen",
      "/doi-tac",
    ].includes(path) ||
    (parts[0] === "to-chuc" && parts.length === 2) ||
    data.content.some(
      (c: any) => "/" + c.slug === path && c.status === "published",
    )
  )
    content = <PublicPage path={path} data={data} />;
  else notFound();
  return (
    <>
      <Header user={data.user} mode={data.mode} />
      <div id="main-content">{content}</div>
      {!workspace && <Footer />}
    </>
  );
}
