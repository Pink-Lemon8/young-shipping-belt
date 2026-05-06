"use server";
import { db } from "@/db/db";
import { sql } from "drizzle-orm";
import EnterLot from "./enter-lot";
import List from "./list";
import BCrumb from "./breadcrumb";
import { Navbar } from "@/components/layout/management/sidebar/navbar";

const AllowedBeltCodes = ["C"];
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const { lotNumber } = await searchParams;

  if (!lotNumber) return <EnterLot />;

  const query = sql`SELECT 
    i.order_id,
  o.patient_id,
  o.shipping_method,
  o.tracking_number,
   o.patient_name,
    i.lot_number, 
    q.status,
    q.cage_code,
    i.created_at
  FROM order_items AS i 
  LEFT JOIN orders AS o ON i.order_id = o.order_id
  LEFT JOIN belt_queues AS q ON q.order_id = o.order_id
  WHERE i.lot_number = ${lotNumber}
    AND q.belt_code IN (${AllowedBeltCodes})
  order by i.created_at ASC;`;

  const [data, fields] = await db.execute(query);
  const attributes = fields.map((field) => field.name);
  return (
    <>
      <Navbar title="Lot Search Results" />
      <div className="container flex flex-col items-start justify-center mx-auto my-10 gap-4">
        <List attributes={attributes} data={Array.isArray(data) ? data : []} />
      </div>
    </>
  );
}
