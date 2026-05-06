import PlaceholderContent from "@/components/common/placeholder-content";
import BCrumb from "./breadcrumb";

export default function Loading() {
  return (
    <div className="container mx-auto py-10">
      <BCrumb />
      <PlaceholderContent loading={true} />
    </div>
  );
}
