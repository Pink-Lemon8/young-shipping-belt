"use server";
import { Address } from "./types";
import "dotenv/config";
import xmlJs from "xml-js";
import fs from "fs";
const end_point = "https://cvp.pharmacywire.com/momex/NavCode/xmlconnect";

const end_point_demo =
  "https://cvp.test.pharmacywire.com/momex/NavCode/xmlconnect";

export async function checkConnection(
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const obj: any = await post("LoginTest", local, undefined, pwUsername, pwPassword);
    if (
      obj.transaction.status != null &&
      obj.transaction.status._text == "success"
    )
      return true;
    return false;
  } catch (error) {
    return error;
  }
}

export async function getAllCatalog(
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const obj = (await post(
      "Catalog",
      undefined,
      local,
      pwUsername,
      pwPassword
    )) as Response;
    return obj;
  } catch (error) {
    return error;
  }
}

export async function getPackage(
  pwPackageId: String = "",
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const filter = {
      "momex:criteria": {
        "pw:package": {
          _attributes: {
            "pw:id": pwPackageId,
          },
        },
      },
    };
    const obj = (await post(
      "Catalog",
      local,
      filter,
      pwUsername,
      pwPassword
    )) as Response;
    return obj;
  } catch (error) {
    return error;
  }
}

export async function getDrug(
  pwDrugId: String = "",
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const filter = {
      "momex:criteria": {
        "pw:drug": {
          _attributes: {
            "pw:id": pwDrugId,
          },
        },
      },
    };
    const obj = await post("Catalog", local, filter, pwUsername, pwPassword);
    return obj;
  } catch (error) {
    return error;
  }
}

export async function getPatientDetail(pwUserId: String,
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const add = {
      "pw:patient": {
        _attributes: {
          "momex:id": pwUserId
        }
      }
    };
    const obj = await post("GetPatientInfo", local, add, pwUsername, pwPassword);
    return obj;
  } catch (error) {
    return error;
  }
}


export async function getPatientShipping(
  pwUserId: string,
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const add = {
      "pw:patient": {
        _attributes: {
          ["momex:id"]: pwUserId,
        },
      },
    };
    const obj = (await post(
      "GetShippingAddresses",
      local,
      add,
      pwUsername,
      pwPassword
    )) as Response;
    return obj;
  } catch (error) {
    return error;
  }
}

export async function createPatientShipping(
  pwUserId: string,
  address: Address,
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const add = {
      "pw:patient": {
        _attributes: {
          ["momex:id"]: pwUserId,
        },
      },
      shippingaddress: {
        "momex:address1": address.street,
        "momex:city": address.city,
        "momex:province": address.state,
        "momex:country": address.country,
        "momex:postalcode": address.postalCode,
        "momex:phone": address.phone?.number,
        "momex:areacode": address.phone?.area,
      },
    };
    const obj = (await post(
      "AddShippingAddress",
      local,
      add,
      pwUsername,
      pwPassword
    )) as Response;
    return obj;
  } catch (error) {
    return error;
  }
}

export async function editPatientShipping(
  pwUserId: string,
  address: Address,
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const add = {
      "pw:patient": {
        _attributes: {
          ["momex:id"]: pwUserId,
        },
      },
      shippingaddress: {
        _attributes: {
          ["momex:id"]: address.pwAddressId,
        },
        "momex:address1": address.street,
        "momex:address2": address.street2,
        "momex:address3": address.street3,
        "momex:city": address.city,
        "momex:province": address.state,
        "momex:country": address.country,
        "momex:postalcode": address.postalCode,
        "momex:phone": address.phone?.number,
        "momex:areacode": address.phone?.area,
      },
    };
    const obj = (await post(
      "EditShippingAddress",
      local,
      add,
      pwUsername,
      pwPassword
    )) as Response;
    return obj;
  } catch (error) {
    return error;
  }
}

export async function deletePatientShipping(
  pwUserId: string,
  pwAddressId: string,
  local: boolean = true,
  pwUsername: string = "none",
  pwPassword: string = "none"
) {
  try {
    const add = {
      "pw:patient": {
        _attributes: {
          ["momex:id"]: pwUserId,
        },
      },
      shippingaddress: {
        _attributes: {
          ["momex:id"]: pwAddressId,
        },
      },
    };
    const obj = (await post(
      "DeleteShippingAddress",
      local,
      add,
      pwUsername,
      pwPassword
    )) as Response;
    return obj;
  } catch (error) {
    return error;
  }
}

export async function getOrderDetail(pwOrderId: String, local: boolean = true, pwUsername: string = "none", pwPassword: string = "none") {
  try {
    const add = {
      orders: {
        order: {
          _attributes: {
            "momex:id": pwOrderId
          }
        }
      }
    };
    const obj = await post("GetOrders", local, add, pwUsername, pwPassword);
    return obj;
  } catch (error) {
    return error;
  }
}

export async function post(
  type: String = "",
  local: boolean = true,
  json: any = null,
  PHARMACYWIRE_USERNAME: string = "none",
  PHARMACYWIRE_PASSWORD: string = "none",
  saveFilePath: String = "",
  saveResponseFilePath: String = ""
) {
  try {
    const url =
      process.env.PHARMACYWIRE_DEMO != null &&
        process.env.PHARMACYWIRE_DEMO.toLocaleLowerCase() == "true"
        ? end_point_demo
        : end_point;
    const body_xml = base_xml(
      type,
      local,
      json,
      PHARMACYWIRE_USERNAME,
      PHARMACYWIRE_PASSWORD
    );
    const response = (await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
      },
      body: body_xml,
    })) as Response;
    if (saveFilePath !== "") save(body_xml, String(saveFilePath));
    const body = await response.text();
    if (saveResponseFilePath !== "") save(body, String(saveResponseFilePath));
    const obj = JSON.parse(xmlJs.xml2json(body, { compact: true, spaces: 4 }));
    return obj as any;
  } catch (error) {
    return error;
  }
}

function base_xml(
  type: String = "",
  local: boolean = true,
  json: any = undefined,
  PHARMACYWIRE_USERNAME: string = "none",
  PHARMACYWIRE_PASSWORD: string = "none"
) {
  const base = {
    transaction: {
      _attributes: {
        xmlns: "http://www.metrex.net/momex/transaction#",
        "xmlns:momex": "http://www.metrex.net/momex#",
        "xmlns:mt": "http://www.metrex.net/momex/terms#",
        "xmlns:pw": "http://www.pharmacywire.com/",
        type: type,
        local: local ? "true" : "false",
      },
      "momex:authenticate": {
        _attributes: {
          "momex:username":
            PHARMACYWIRE_USERNAME === "none"
              ? (process.env.PHARMACYWIRE_USERNAME_DEMO ??
                process.env.PHARMACYWIRE_USERNAME) ?? ""
              : PHARMACYWIRE_USERNAME,
          "momex:password":
            PHARMACYWIRE_PASSWORD === "none"
              ? (process.env.PHARMACYWIRE_PASSWORD_DEMO ?? process.env.PHARMACYWIRE_PASSWORD) ?? ""
              : PHARMACYWIRE_PASSWORD,
        },
      },
      ...json,
    },
  };
  const xmlString = xmlJs.js2xml(base, { compact: true, spaces: 4 });
  return xmlString;
}

function save(xml = "", name: string) {
  fs.writeFile(name, xml, (err: any) => {
    if (err) throw err;
  });
}
