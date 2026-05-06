import { Button } from "@/components/ui/button";
import { SettingsIcon } from "lucide-react";
import Link from "next/link";

export default function AccountInfo({ user }: { user: any }) {
  return (
    <div>
      <div className="px-4 sm:px-0">
        <h3 className="text-base/7 font-semibold">Applicant Information</h3>
        <p className="mt-1 max-w-2xl text-sm/6">
          Personal details and application.
        </p>
      </div>
      <div className="mt-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          <div className="border-t px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm/6 font-medium">Name</dt>
            <dd className="mt-1 text-sm/6 sm:mt-2">{user?.name}</dd>
          </div>
          <div className="border-t px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm/6 font-medium">Department</dt>
            <dd className="mt-1 text-sm/6 sm:mt-2">
              {user?.department ?? "N/A"}
            </dd>
          </div>
          <div className="border-t px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm/6 font-medium">Email address</dt>
            <dd className="mt-1 text-sm/6 sm:mt-2">{user?.email}</dd>
          </div>
          <div className="border-t px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm/6 font-medium">Login Type</dt>
            <dd className="mt-1 text-sm/6 sm:mt-2">{user?.loginType}</dd>
          </div>
          <div className="border-t px-4 py-6 sm:col-span-2 sm:px-0">
            <dt className="text-sm/6 font-medium flex items-center gap-2">
              Profile Settings
            </dt>
            <dd className="mt-1 text-sm/6 sm:mt-2">
              <Link href="/account/settings">
                <Button
                  variant="outline"
                  className="text-sm/6 sm:mt-2 cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  View Profile Settings
                </Button>
              </Link>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
