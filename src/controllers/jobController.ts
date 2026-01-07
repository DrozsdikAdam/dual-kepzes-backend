import { Request, Response } from "express";
import prisma from "../config/prisma";
import { CompanyInput, PositionInput } from "../schemas/jobSchema";

export const createCompany = async (
  req: Request<{}, {}, CompanyInput>,
  res: Response
) => {
  const data = req.body;
  try {
    const existingCompany = await prisma.company.findUnique({
      where: { taxId: data.taxId },
    });

    if (existingCompany) {
      return res
        .status(400)
        .json({ message: "Már létezik cég a megadott adószámmal." });
    }

    const newCompany = await prisma.company.create({
      data: {
        name: data.name,
        taxId: data.taxId,
        hqCountry: data.hqCountry,
        hqZipCode: String(data.hqZipCode) || "",
        hqCity: data.hqCity || "",
        hqAddress: data.hqAddress || "",
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        website: data.website,
        logoUrl: data.logoUrl,
      },
    });

    res
      .status(201)
      .json({ message: "Sikeres cég létrehozás", company: newCompany });
  } catch (error) {
    console.error("Company Creation Error:", error);
    return res
      .status(500)
      .json({ message: "Hiba történt a cég létrehozásakor." });
  }
};

export const createPosition = async (
  req: Request<{}, {}, PositionInput>,
  res: Response
) => {
  const data = req.body;
  try {
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      return res.status(404).json({ message: "A megadott cég nem találhazó." });
    }

    const newPosition = await prisma.position.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        description: data.description,
        zipCode: data.zipCode,
        city: data.city,
        address: data.address,
        deadline: data.deadline,
      },
    });
    res.status(201).json({
      message: "Pozíció sikeresen meghirdetve",
      position: newPosition,
    });
  } catch (error) {
    console.error("Position Creation Error:", error);
    res.status(500).json({ message: "Hiba történt a pozíció mentése során." });
  }
};
