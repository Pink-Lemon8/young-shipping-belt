"use server";
import { Card, CardContent } from "@/components/ui/card";
import BCrumb from "./breadcrumb";
import { UserList } from "@/components/entity/user/list/list";
import { Navbar } from "@/components/layout/management/sidebar/navbar";
export default async function UsersPage() {
  return (
    <>
      <Navbar title="Users" />
      <div className="p-4 sm:p-5">
        <UserList />
      </div>
    </>
  );
}
