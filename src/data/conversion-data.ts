// The EV Conversion Technical Information Sheet, field-for-field from
// KGR_Partners_EV_Conversion_Information_Sheet.pdf. Labels double as the
// metadata keys sent to the contact endpoint (each becomes a labeled row
// in the email KGR receives), so keep them human-readable.

export interface ConversionField {
  id: string;
  label: string;
  type?: "text" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
}

export interface ConversionSection {
  title: string;
  description?: string;
  fields: ConversionField[];
}

// section 1 — contactPerson / emailAddress / phoneNumber map to the
// endpoint's top-level name / email / phone; the rest ride in metadata
export const CONVERSION_SECTIONS: ConversionSection[] = [
  {
    title: "Customer information",
    description:
      "Who should our engineers reply to? Only your name and email are required; everything else helps us respond faster.",
    fields: [
      { id: "contactPerson", label: "Contact Person" },
      { id: "emailAddress", label: "Email Address" },
      { id: "phoneNumber", label: "Phone Number" },
      { id: "companyName", label: "Company Name" },
      { id: "address", label: "Address" },
    ],
  },
  {
    title: "Vehicle to be converted",
    description:
      "Tell us about the vehicle. Fill in what you know; skip what you do not.",
    fields: [
      { id: "vehicleMake", label: "Vehicle Make" },
      { id: "vehicleModel", label: "Vehicle Model" },
      { id: "modelYear", label: "Model Year" },
      { id: "vin", label: "VIN / Chassis Number" },
      {
        id: "vehicleType",
        label: "Vehicle Type",
        type: "select",
        options: [
          "Car",
          "Van",
          "Pickup",
          "Bus",
          "Truck",
          "Motorcycle",
          "Other",
        ],
      },
      { id: "bodyStyle", label: "Body Style" },
      {
        id: "engineType",
        label: "Existing Engine Type",
        type: "select",
        options: ["Petrol", "Diesel", "Hybrid"],
      },
      { id: "engineDisplacement", label: "Engine Displacement (cc)" },
      { id: "seats", label: "Number of Seats / Passengers" },
      { id: "doors", label: "Number of Doors" },
      { id: "emptyWeight", label: "Empty Vehicle Weight (Kg)" },
      { id: "grossWeight", label: "Gross Vehicle Weight – GVW (Kg)" },
      { id: "payload", label: "Payload / Cargo Capacity (Kg)" },
      { id: "axles", label: "Number of Axles" },
      {
        id: "drivetrain",
        label: "Current Drivetrain Layout",
        type: "select",
        options: ["FWD", "RWD", "AWD"],
      },
      { id: "wheelbase", label: "Wheelbase (mm)" },
      { id: "tyreSize", label: "Tyre Size" },
      { id: "wheelRadius", label: "Driving Wheel Radius (mm)" },
    ],
  },
  {
    title: "Performance & range requirements",
    description:
      "What should the converted vehicle be able to do? Estimates are fine.",
    fields: [
      { id: "desiredRange", label: "Desired Range per Charge (Km)" },
      { id: "topSpeed", label: "Desired Top Speed (Km/h)" },
      { id: "fullLoadFlatSpeed", label: "Full-Load Flat-Road Speed (Km/h)" },
      { id: "noLoadFlatSpeed", label: "No-Load Flat-Road Speed (Km/h)" },
      { id: "fullLoadClimbSpeed", label: "Full-Load Climbing Speed (Km/h)" },
      { id: "noLoadClimbSpeed", label: "No-Load Climbing Speed (Km/h)" },
      { id: "fullLoadGradient", label: "Full-Load Climbing Gradient (%)" },
      { id: "noLoadGradient", label: "No-Load Climbing Gradient (%)" },
      { id: "accel050", label: "Acceleration 0–50 Km/h (sec)" },
      { id: "accel5080", label: "Acceleration 50–80 Km/h (sec)" },
    ],
  },
  {
    title: "Motor & drive requirements",
    description:
      "Leave anything you are unsure about blank; our engineers will specify it.",
    fields: [
      { id: "driveMotors", label: "Number of Drive Motors Required" },
      {
        id: "motorType",
        label: "Motor Type Preference",
        type: "select",
        options: ["AC Induction", "PMSM", "No Preference"],
      },
      { id: "ratedPower", label: "Rated Power (KW)" },
      { id: "peakPower", label: "Peak Power (KW)" },
      { id: "ratedTorque", label: "Rated Torque (N.m)" },
      { id: "maxTorque", label: "Maximum Torque (N.m)" },
      { id: "ratedSpeed", label: "Rated Speed (rpm)" },
      { id: "peakSpeed", label: "Peak Speed (rpm)" },
      { id: "controllerModel", label: "Controller Model (if known)" },
      {
        id: "controllerCurrent",
        label: "Controller Max Working Current (A)",
      },
    ],
  },
  {
    title: "Battery & charging requirements",
    description:
      "How much energy, and how should it charge? Estimates are fine.",
    fields: [
      { id: "batteryCapacity", label: "Required Battery Capacity (kWh)" },
      { id: "batteryVoltage", label: "Battery Voltage (VDC)" },
      {
        id: "batteryLocation",
        label: "Preferred Battery Mounting Location",
      },
      {
        id: "bmsRequired",
        label: "Battery Management System (BMS) Required",
        type: "select",
        options: ["Yes", "No"],
      },
      {
        id: "batteryChemistry",
        label: "Preferred Battery Chemistry",
        type: "select",
        options: ["LiFePO4", "NMC", "Lead-Acid", "No Preference"],
      },
      { id: "maxBatteryWeight", label: "Maximum Battery Weight Allowed (Kg)" },
      {
        id: "chargingMode",
        label: "Charging Mode",
        type: "select",
        options: ["AC Level 1", "AC Level 2", "DC Fast Charging"],
      },
      {
        id: "connectorType",
        label: "Charging Connector Type",
        type: "select",
        options: ["Type 2", "CCS", "CHAdeMO", "GB/T", "Other"],
      },
      { id: "fullChargeTime", label: "Desired Full-Charge Time (hrs)" },
      { id: "chargerPower", label: "On-Board Charger Power (kW)" },
    ],
  },
  {
    title: "Remarks & review",
    description:
      "Anything else our engineers should know, then send the sheet.",
    fields: [
      {
        id: "remarks",
        label: "Additional Requirements / Remarks",
        type: "textarea",
        placeholder: "Route terrain, daily hours of use, budget range...",
      },
      {
        id: "photoLink",
        label: "Link to Vehicle Photos",
        placeholder: "Google Drive, Dropbox or any shareable link",
      },
    ],
  },
];

// top-level endpoint fields; everything else goes into metadata
export const TOP_LEVEL_FIELD_IDS = [
  "contactPerson",
  "emailAddress",
  "phoneNumber",
  "remarks",
] as const;

export const CONVERSION_PDF_PATH =
  "/downloads/KGR-EV-Conversion-Information-Sheet.pdf";

export const CONVERSION_MAILTO = `mailto:kgrpartners744@gmail.com?subject=${encodeURIComponent(
  "Completed EV Conversion Information Sheet",
)}`;
