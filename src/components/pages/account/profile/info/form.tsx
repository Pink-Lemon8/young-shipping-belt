"use client";
import {
  useState,
  useEffect,
  SetStateAction,
  Dispatch,
  useActionState,
  useRef,
  startTransition,
} from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Upload, X } from "lucide-react";
import { Result } from "@/lib/types";
import { edit } from "./actions";
import { motion } from "framer-motion";
import { File as FileType } from "@/components/entity/file/type";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { Role } from "@/components/entity/user/list/components/role";
import { FileShowImage } from "@/components/entity/file/show/image";
import { set } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { user } from "@/db/schema";

type InfoFormProps = {
  disabled?: boolean;
  setDisabled?: Dispatch<SetStateAction<boolean>>;
  loading?: boolean;
  setLoading?: Dispatch<SetStateAction<boolean>>;
  setResult?: Dispatch<SetStateAction<Result | undefined>>;
};

export default function InfoForm({
  disabled,
  setDisabled,
  loading,
  setLoading,
  setResult,
}: InfoFormProps) {
  const { data: sessionData, refetch } = useSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, formAction, isPending] = useActionState<
    Result | undefined,
    FormData
  >(edit, undefined);

  const [fullName, setFullName] = useState(sessionData?.user?.name ?? "");

  const [language, setLanguage] = useState(
    sessionData?.user?.language ?? "en-US"
  );
  const [timezone, setTimezone] = useState(
    sessionData?.user?.timezone ?? "UTC"
  );
  const [bio, setBio] = useState(sessionData?.user?.bio ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(
    sessionData?.user?.image ? sessionData?.user?.image : null
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState(
    sessionData?.user?.phoneNumber ?? "N/A"
  );

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    setFullName(sessionData?.user?.name ?? "");
    setPhoneNumber(formatPhoneNumber(sessionData?.user?.phoneNumber ?? "N/A"));
    setLanguage(sessionData?.user?.language ?? "en-US");
    setTimezone(sessionData?.user?.timezone ?? "UTC");
    setImage(sessionData?.user?.image ?? null);
    setImagePreview(null);
    setBio(sessionData?.user?.bio ?? "");
  }, [disabled, sessionData]);

  useEffect(() => {
    setResult?.(result);
    if (result) {
      setLoading?.(false);
      refetch();
    }
  }, [result]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading?.(true);
    const formData = new FormData(event.target as HTMLFormElement);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative flex flex-col items-center gap-3">
          {image && !imagePreview && (
            <div>
              {result?.errors?.some((error) => error.field === "image") &&
                !disabled && (
                  <div className="absolute -top-1.5 -left-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-5 w-5 text-destructive cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {result?.errors?.find(
                          (error) => error.field === "image"
                        )?.message ?? "Invalid image"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              <FileShowImage
                file={{
                  id: Number(image),
                }}
                width={256}
                height={256}
                className={cn(
                  "size-24 rounded-full p-0 m-0 object-cover",
                  result?.errors?.some((error) => error.field === "image") &&
                    !disabled
                    ? "border-2 border-destructive"
                    : ""
                )}
              />
            </div>
          )}

          {imagePreview && (
            <Avatar className="size-24 rounded-full p-0 m-0">
              <AvatarImage
                src={imagePreview ?? sessionData?.user?.image ?? ""}
                alt={sessionData?.user?.name ?? ""}
              />
              <AvatarFallback>
                {sessionData?.user?.name
                  ? sessionData?.user?.name?.charAt(0).toUpperCase() +
                    sessionData?.user?.name?.charAt(1).toUpperCase()
                  : ""}
              </AvatarFallback>
            </Avatar>
          )}

          {!image && !imagePreview && (
            <div>
              {result?.errors?.some((error) => error.field === "image") &&
                !disabled && (
                  <div className="absolute -top-1.5 -left-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-5 w-5 text-destructive cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {result?.errors?.find(
                          (error) => error.field === "image"
                        )?.message ?? "Invalid image"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              <Avatar
                className={cn(
                  "size-24 rounded-full p-0 m-0",
                  result?.errors?.some((error) => error.field === "image") &&
                    !disabled
                    ? "border-2 border-destructive"
                    : ""
                )}
              >
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${
                    (sessionData?.user?.name?.charAt(0).toUpperCase() ?? "") +
                    (sessionData?.user?.name?.charAt(1).toUpperCase() ?? "")
                  }`}
                />
                <AvatarFallback>
                  {sessionData?.user?.name
                    ? sessionData?.user?.name?.charAt(0).toUpperCase() +
                      sessionData?.user?.name?.charAt(1).toUpperCase()
                    : ""}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {!disabled && !loading && (
            <>
              {image && (
                <motion.div
                  className="absolute rounded-full -top-4 -right-2 cursor-pointer hover:bg-primary/10 transition-colors duration-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="link"
                    size="icon"
                    className="rounded-full font-extrabold text-red-600 hover:text-red-700 cursor-pointer"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      setImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4 stroke-4" />
                  </Button>
                </motion.div>
              )}
              {!image && (
                <motion.div
                  className="absolute bg-muted rounded-full bottom-0 -right-2 cursor-pointer hover:bg-primary/10 transition-colors duration-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    type="file"
                    name="image"
                    id="image"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    ref={fileInputRef}
                    max={5 * 1024 * 1024}
                    onChange={handleImageChange}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("image")?.click();
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>

        <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={fullName}
              readOnly={disabled}
              onChange={(e) => {
                setFullName(e.target.value);
              }}
              className={disabled ? "bg-muted" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address
              <span className="text-xs text-red-500">
                (email cannot be changed)
              </span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={sessionData?.user?.email}
              readOnly={true}
              className={disabled ? "bg-muted" : ""}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="role">
              Role{" "}
              <span className="text-xs text-muted-foreground">
                (This is your role in the system)
              </span>
            </Label>
            <div>
              {sessionData?.user?.role && (
                <Role role={sessionData?.user?.role} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Phone Number{" "}
              <span className="text-xs text-muted-foreground">
                (Auto Formatting)
              </span>
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={phoneNumber}
              readOnly={disabled}
              onKeyDown={(e) => {
                if (
                  e.key === "Backspace" &&
                  phoneNumber === "N/A" &&
                  !disabled
                ) {
                  setPhoneNumber("");
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                setPhoneNumber(formatPhoneNumber(e.target.value));
              }}
              placeholder="(555) 123-4567"
              className={disabled ? "bg-muted" : ""}
            />
          </div>
        </div>
      </div>

      {/* <Separator /> */}

      {/* <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            name="language"
            disabled={disabled}
            value={language}
            onValueChange={setLanguage}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="en-GB">English (UK)</SelectItem>
              <SelectItem value="es-ES">Spanish</SelectItem>
              <SelectItem value="fr-FR">French</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            name="timezone"
            disabled={disabled}
            value={timezone}
            onValueChange={setTimezone}
          >
            <SelectTrigger className="disabled:text-muted-foreground">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">
                Eastern Time (ET)
              </SelectItem>
              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
              <SelectItem value="America/Los_Angeles">
                Pacific Time (PT)
              </SelectItem>
              <SelectItem value="Europe/London">GMT/BST (UK)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div> */}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
          }}
          placeholder="Write something about yourself..."
          readOnly={disabled}
          rows={4}
          className={disabled ? "bg-muted" : ""}
        />
      </div>

      {!disabled ? (
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            className="cursor-pointer w-28"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </motion.div>
      ) : undefined}
    </form>
  );
}
