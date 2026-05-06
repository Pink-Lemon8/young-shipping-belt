"use server"

import { db } from "@/db/db";

export async function getAllAffiliates(password: boolean = false) {
    try {
        const affiliates = await db.query.affiliates.findMany({
            columns: {
                pwAuthPassword: password,
                pwAuthUsername: true,
                id: true,
                code: true,
                name: true,
                shippingPreference: true,
                pwLocal: true,
                status: true,
                createdAt: true
            },
            orderBy: (affiliate, { desc }) => [desc(affiliate.createdAt)]
        });
        return affiliates;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

export async function getAffiliateByCode(code: string, password: boolean = false) {
    try {
        const affiliate = await db.query.affiliates.findFirst({
            where: (affiliate, { eq }) => eq(affiliate.code, code),
            columns: {
                pwAuthPassword: password,
                pwAuthUsername: true,
                id: true,
                code: true,
                name: true,
                shippingPreference: true,
                pwLocal: true,
                status: true,
                createdAt: true
            },
            orderBy: (affiliate, { desc }) => [desc(affiliate.createdAt)]
        });
        return affiliate;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

export async function getAffiliateByName(name: string, password: boolean = false) {
    try {
        const affiliate = await db.query.affiliates.findFirst({
            where: (affiliate, { eq }) => eq(affiliate.name, name),
            columns: {
                pwAuthPassword: password,
                pwAuthUsername: true,
                id: true,
                code: true,
                name: true,
                shippingPreference: true,
                pwLocal: true,
                status: true,
                createdAt: true
            },
            orderBy: (affiliate, { desc }) => [desc(affiliate.createdAt)]
        });
        return affiliate;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

export async function getAffiliateByNameAndCode(name: string, code: string, password: boolean = false) {
    try {
        const affiliate = await db.query.affiliates.findFirst({
            where: (affiliate, { eq, and }) => and(eq(affiliate.name, name), eq(affiliate.code, code)),
            columns: {
                pwAuthPassword: password,
                pwAuthUsername: true,
                id: true,
                code: true,
                name: true,
                shippingPreference: true,
                pwLocal: true,
                status: true,
                createdAt: true
            },
            orderBy: (affiliate, { desc }) => [desc(affiliate.createdAt)]
        });
        return affiliate;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

export async function getAffiliateById(id: number, password: boolean = false) {
    try {
        const affiliate = await db.query.affiliates.findFirst({
            where: (affiliate, { eq }) => eq(affiliate.id, id),
            columns: {
                pwAuthUsername: true,
                pwAuthPassword: password,
                id: true,
                code: true,
                name: true,
                shippingPreference: true,
                status: true,
                pwLocal: true,
                createdAt: true
            },
            orderBy: (affiliate, { desc }) => [desc(affiliate.createdAt)]
        });
        return affiliate;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

