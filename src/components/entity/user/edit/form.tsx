"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Fragment,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { edit } from "./actions";
import { Result } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { userRoles } from "@/lib/auth/roles-and-permissions";
import { toast } from "sonner";
import { User } from "../type";
import { isUserRoleLevelAllowed } from "@/lib/auth/utils/helpers";
import { useSession } from "@/lib/auth/auth-client";
import { motion } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { belts, beltStages } from "@/lib/const";
import { getAllAffiliates } from "@/server/controller/affiliates";
type EditUserFormProps = {
  user?: User;
  setResult?: React.Dispatch<React.SetStateAction<any>>;
};

export function EditUserForm({
  user,
  setResult = undefined,
}: EditUserFormProps) {
  const { data: sessionData } = useSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction, isPending] = useActionState<
    Result | undefined,
    FormData
  >(edit, undefined);

  const [openAffiliates, setOpenAffiliates] = useState(false);
  const [affiliates, setAffiliates] = useState<any[] | undefined>(undefined);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);
  const [selectedAffiliates, setSelectedAffiliates] = useState<
    { id: number; name: string }[] | undefined
  >(undefined);

  const [beltCode, setBeltCode] = useState<string>("");
  const [role, setRole] = useState<string | undefined>(undefined);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("**********");

  const fetchAffiliates = async () => {
    setLoadingAffiliates(true);
    const affiliates = await getAllAffiliates();
    setAffiliates(affiliates);
    setLoadingAffiliates(false);
  };

  useEffect(() => {
    if (user === undefined) return;
    if (affiliates === undefined && user?.role === "pharmacy")
      fetchAffiliates();
    setRole(user.role ?? "regular");
    setBeltCode(user?.beltCode ?? "");
  }, [user]);

  useEffect(() => {
    if (role === undefined) return;
    if (affiliates === undefined && role === "pharmacy") fetchAffiliates();
    if (
      !["superAdmin", "admin", "coordinator", "belt"].includes(
        role ?? "regular"
      )
    )
      setBeltCode("");
    if (["belt"].includes(role ?? "regular"))
      setBeltCode(user?.beltCode ?? belts[0]);
    if (["superAdmin", "admin", "coordinator"].includes(role ?? "regular"))
      setBeltCode(user?.beltCode ?? "no-belt-code");
  }, [role]);

  useEffect(() => {
    if (affiliates === undefined) return;
    setSelectedAffiliates(
      user?.affiliates?.split(",").map((affiliateId) => {
        const affiliateData = affiliates?.find(
          (a) => a.id.toString() === affiliateId.toString()
        );
        return {
          id: affiliateData?.id,
          name: affiliateData?.name,
        };
      })
    );
  }, [affiliates]);

  const generatePassword = () => {
    const newPassword =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    setPassword(newPassword);
    setShowPassword(true);
    navigator.clipboard.writeText(newPassword);
    toast.message(
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4" />
        <p>Password copied to clipboard</p>
      </div>
    );
  };

  useEffect(() => {
    setResult?.(result);
  }, [result]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowPassword(false);
    const formData = new FormData(event.target as HTMLFormElement);

    if (role === "pharmacy") {
      if (selectedAffiliates === undefined || selectedAffiliates.length === 0) {
        toast.error("Please select at least one affiliate");
        return;
      }
    }

    if (
      ["superAdmin", "admin", "coordinator", "belt"].includes(role ?? "regular")
    ) {
      if ((beltCode === "" || beltCode === "no-belt-code") && role === "belt") {
        toast.error("Please select a belt code");
        return;
      } else formData.append("beltCode", beltCode);

      formData.append("beltCode", beltCode === "no-belt-code" ? "" : beltCode);
    } else formData.append("beltCode", "");

    if (user) formData.append("userId", user.id);

    formData.append(
      "affiliates",
      selectedAffiliates?.map((a) => a.id.toString())?.join(",") ?? ""
    );

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 p-1">
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={user?.name}
            required
            className={cn(
              result?.status === "error" &&
                result.errors?.find((error) => error.field === "name") &&
                "border-red-500 focus-visible:ring-red-500 ring-red-500"
            )}
            placeholder="e.g. Main Storage"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user?.email}
            required
            className={cn(
              result?.status === "error" &&
                result.errors?.find((error) => error.field === "email") &&
                "border-red-500 focus-visible:ring-red-500 ring-red-500"
            )}
            placeholder="e.g. johndoe@example.com"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            type="text"
            defaultValue={user?.department ?? ""}
            className={cn(
              result?.status === "error" &&
                result.errors?.find((error) => error.field === "department") &&
                "border-red-500 focus-visible:ring-red-500 ring-red-500"
            )}
            placeholder="e.g. IT, Fullfillment, etc."
          />
        </div>

        <div className="space-y-1 mt-4">
          <Label htmlFor="password">
            Password{" "}
            <span className="text-xs text-red-500">
              (don't change if you want to keep the same)
            </span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={cn(
                result?.status === "error" &&
                  result.errors?.find((error) => error.field === "password") &&
                  "border-red-500 focus-visible:ring-red-500 ring-red-500"
              )}
              placeholder="e.g. **********"
            />
            <Button
              type="button"
              className="absolute px-2 right-0 -top-10 h-full cursor-pointer"
              onClick={() => generatePassword()}
            >
              Generate
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="absolute px-2 right-0 top-0 h-full cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        {role !== undefined && (
          <div className="space-y-1">
            <Label htmlFor="role">Role *</Label>
            <Select
              name="role"
              required
              value={role}
              onValueChange={(value) => setRole(value)}
            >
              <SelectTrigger
                className={cn(
                  "capitalize",
                  result?.status === "error" &&
                    result.errors?.find((error) => error.field === "role") &&
                    "border-red-500 focus-visible:ring-red-500 ring-red-500"
                )}
              >
                <SelectValue
                  placeholder="Select a role"
                  id="role"
                  aria-label="role"
                />
              </SelectTrigger>
              <SelectContent>
                {/* Combined filter iterations (Rule 7.5) */}
                {Object.keys(userRoles)
                  .filter((rl) =>
                    isUserRoleLevelAllowed(sessionData?.user?.role, rl) &&
                    rl !== "pharmacy" &&
                    rl !== "labelHelper"
                  )
                  .map((rl) => (
                    <SelectItem key={rl} value={rl} className="capitalize">
                      {rl}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {role === "pharmacy" && (
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Label htmlFor="affiliates">
              Affiliates shown for pharmacy user *
            </Label>
            <Popover open={openAffiliates} onOpenChange={setOpenAffiliates}>
              <PopoverTrigger asChild id="affiliates">
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openAffiliates}
                  className="w-full justify-between h-fit"
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedAffiliates?.map((affiliate, index) => (
                      <Badge key={index}>{affiliate.name}</Badge>
                    ))}
                    {selectedAffiliates === undefined ||
                    selectedAffiliates?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Select Affiliates...
                      </p>
                    ) : undefined}
                  </div>
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command autoFocus>
                  <CommandInput
                    placeholder="Search framework..."
                    className="h-10"
                  />
                  <CommandList>
                    <CommandEmpty>No framework found.</CommandEmpty>
                    <CommandGroup>
                      {affiliates?.map((affiliate) => (
                        <CommandItem
                          key={affiliate.id}
                          value={
                            affiliate.id.toString() +
                            "-" +
                            affiliate.name +
                            "-" +
                            affiliate.code
                          }
                          onSelect={(currentValue) => {
                            setSelectedAffiliates(
                              selectedAffiliates?.find(
                                (a) => a.id === affiliate.id
                              )
                                ? selectedAffiliates?.filter(
                                    (a) => a.id !== affiliate.id
                                  )
                                : [...(selectedAffiliates ?? []), affiliate]
                            );
                            setOpenAffiliates(false);
                          }}
                        >
                          {affiliate.name}
                          <Check
                            className={cn(
                              "ml-auto",
                              selectedAffiliates?.find(
                                (a) => a.id === affiliate.id
                              )
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                      {affiliates === undefined && (
                        <CommandItem>Loading affiliates...</CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {["superAdmin", "admin", "coordinator", "belt"].includes(
          role ?? "regular"
        ) && (
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Label htmlFor="beltCode">
              Belt Code {role === "belt" ? "*" : ""}
            </Label>
            <Select
              required={role === "belt"}
              value={beltCode}
              onValueChange={setBeltCode}
            >
              <SelectTrigger
                className={cn(
                  result?.status === "error" &&
                    result.errors?.find(
                      (error) => error.field === "beltCode"
                    ) &&
                    "border-red-500 focus-visible:ring-red-500 ring-red-500"
                )}
              >
                <SelectValue placeholder="Select a belt code" id="beltCode" />
              </SelectTrigger>

              <SelectContent>
                {role !== "belt" && (
                  <SelectItem
                    value="no-belt-code"
                    className="capitalize"
                    onClick={() => setBeltCode("no-belt-code")}
                  >
                    <span className="text-muted-foreground">
                      No Belt Access
                    </span>
                  </SelectItem>
                )}
                {belts.map((belt, beltIndex) => (
                  <Fragment key={beltIndex}>
                    <SelectItem value={belt} className="capitalize">
                      {belt}
                    </SelectItem>
                    {beltStages.map((stage, stageIndex) => (
                      <SelectItem
                        key={`${beltIndex}-${stageIndex}`}
                        value={`${belt}${stage}`}
                        className="capitalize"
                      >
                        {belt}
                        {stage}
                      </SelectItem>
                    ))}
                  </Fragment>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </div>

      {result?.status === "success" && (
        <div className="w-full flex flex-col gap-2">
          {result.messages?.map((message, index) => (
            <p key={index} className="text-sm font-medium text-green-500">
              {message}
            </p>
          ))}
        </div>
      )}

      {result?.status === "error" && (
        <div className="w-full flex flex-col gap-2">
          {result.errors?.map((error, index) => (
            <p key={index} className="text-sm font-medium text-red-500">
              {error.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          className="w-32 cursor-pointer"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Editing...
            </>
          ) : (
            "Edit User"
          )}
        </Button>
      </div>
    </form>
  );
}
