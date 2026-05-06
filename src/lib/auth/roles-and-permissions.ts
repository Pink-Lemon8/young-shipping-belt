import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
} from "better-auth/plugins/organization/access";

export const userPermissionStatements = {
  ...defaultStatements,
  user: [
    "view",
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "set-password",
    "update",
    "delete",
  ],
  organization: [
    "show",
    "member",
    "add-member",
    "remove-member",
    "list",
    "create",
    "update",
    "delete",
  ],
  session: ["list", "revoke", "set-active", "delete"],
  file: ["view", "list", "upload", "download", "delete"],
  guest: ["info"],
} as const;

export const userAc = createAccessControl(userPermissionStatements);

const adminRole = userAc.newRole({
  ...adminAc.statements,
  user: [
    "view",
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "set-password",
    "update",
    "delete",
  ],
  session: ["list", "revoke", "set-active", "delete"],
  organization: [
    "show",
    "member",
    "add-member",
    "remove-member",
    "list",
    "create",
    "update",
    "delete",
  ],
  file: ["view", "list", "upload", "download", "delete"],
});

export const userRoles = {
  superAdmin: adminRole,
  admin: adminRole,

  coordinator: userAc.newRole({
    user: [
      "view",
      "create",
      "list",
      "set-role",
      "ban",
      "set-password",
      "update",
      "delete",
    ],
    organization: [
      "show",
      "member",
      "add-member",
      "remove-member",
      "list",
      "create",
      "update",
    ],
    file: ["view", "list", "upload", "download", "delete"],
  }),

  pharmacy: userAc.newRole({
    user: [
      "view",
      "create",
      "list",
      "set-role",
      "ban",
      "set-password",
      "update",
      "delete",
    ],
    organization: [
      "show",
      "member",
      "add-member",
      "remove-member",
      "list",
      "create",
      "update",
    ],
    file: ["view", "list", "upload", "download", "delete"],
  }),

  csr: userAc.newRole({
    user: [
      "view",
      "create",
      "list",
      "set-role",
      "ban",
      "set-password",
      "update",
      "delete",
    ],
    organization: [
      "show",
      "member",
      "add-member",
      "remove-member",
      "list",
      "create",
      "update",
    ],
    file: ["view", "list", "upload", "download", "delete"],
  }),

  labelHelper: userAc.newRole({
    user: [
      "view",
      "create",
      "list",
      "set-role",
      "ban",
      "set-password",
      "update",
      "delete",
    ],
    organization: [
      "show",
      "member",
      "add-member",
      "remove-member",
      "list",
      "create",
      "update",
    ],
    file: ["view", "list", "upload", "download", "delete"],
  }),

  belt: userAc.newRole({
    user: [
      "view",
      "create",
      "list",
      "set-role",
      "ban",
      "set-password",
      "update",
      "delete",
    ],
    organization: [
      "show",
      "member",
      "add-member",
      "remove-member",
      "list",
      "create",
      "update",
    ],
    file: ["view", "list", "upload", "download", "delete"],
  }),

  pharmacist: userAc.newRole({
    user: [
      "view",
      "create",
      "list",
      "set-role",
      "ban",
      "set-password",
      "update",
      "delete",
    ],
    organization: [
      "show",
      "member",
      "add-member",
      "remove-member",
      "list",
      "create",
      "update",
    ],
    file: ["view", "list", "upload", "download", "delete"],
  }),

  regular: userAc.newRole({
    file: ["view", "download"],
  }),
} as const;

//smallest number is the highest level
export const userRoleLevels = {
  superAdmin: 0,
  admin: 1,
  coordinator: 2,
  pharmacy: 3,
  csr: 4,
  labelHelper: 5,
  pharmacist: 6,
  belt: 7,
  regular: 10,
} as const;
