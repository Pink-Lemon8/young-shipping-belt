import PlaceholderContent from "@/components/common/placeholder-content";
import BCrumb from "./breadcrumb";
export default function Loading() {
  return (
    <>
      <BCrumb />
      <PlaceholderContent loading={true} />
    </>
  );
}
