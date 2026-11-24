
import { OPERATOR_DATA } from "./operator-data.mjs";

function response(data, status = 200) {
  return new Response(JSON.stringify({
    author: "Fluxxy",
    ...data
  }, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    }
  });
}

function normalizeNumber(number) {
  if (!number) {
    throw new Error("Parameter number wajib diisi.");
  }

  let value = number.trim().replace(/[\s\-().]/g, "");

  if (value.startsWith("+62")) {
    value = "0" + value.slice(3);
  } else if (value.startsWith("62")) {
    value = "0" + value.slice(2);
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("Format nomor tidak valid.");
  }

  return value;
}

function findPrefix(number) {
  return Object.keys(OPERATOR_DATA)
    .filter(prefix => number.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0] || null;
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (request.method !== "GET") {
    return response({
      success: false,
      message: "Gunakan method GET."
    }, 405);
  }

  const url = new URL(request.url);
  const rawNumber = url.searchParams.get("number");

  let number;

  try {
    number = normalizeNumber(rawNumber);
  } catch (error) {
    return response({
      success: false,
      message: error.message
    }, 400);
  }

  const valid =
    number.startsWith("08") &&
    number.length >= 10 &&
    number.length <= 13;

  if (!valid) {
    return response({
      success: false,
      message: "Format nomor tidak valid."
    }, 400);
  }

  const prefix = findPrefix(number);

  if (!prefix) {
    return response({
      success: false,
      message: "Prefix tidak ditemukan."
    }, 404);
  }

  return response({
    success: true,
    message: "Data operator berhasil ditemukan.",
    data: {
      input_number: rawNumber,
      normalized_number: number,
      prefix,
      valid_format: true,
      prefix_found: true,
      ...OPERATOR_DATA[prefix]
    },
    meta: {
      lookup_type: "prefix_database",
      operator_status: "based_on_prefix",
      number_activity_checked: false,
      response_mode: "all"
    }
  });
}

export const config = {
  path: "/api/v1/validate"
};
