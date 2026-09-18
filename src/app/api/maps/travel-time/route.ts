import { NextRequest, NextResponse } from "next/server";

const COURT_MAPPINGS: { [key: string]: string } = {
  "دار القضاء العالي": "Dar El-Qada El-Aly, Ramsis Street, Cairo, Egypt",
  "محكمة النقض": "Dar El-Qada El-Aly, Ramsis Street, Cairo, Egypt",
  "شمال القاهرة": "Cairo North Court, Abbassia, Cairo, Egypt",
  "المحكمة الاقتصادية": "Cairo Economic Court, Maadi, Cairo, Egypt",
  "استئناف عالي القاهرة": "New Cairo Court, Fifth Settlement, Cairo, Egypt",
  "جنوب القاهرة": "Cairo South Court, Bab El Khalq, Cairo, Egypt",
  "الدقي": "Dokki Court, Giza, Egypt",
  "مجلس الدولة": "State Council (Magles El-Dowla), Dokki, Giza, Egypt",
  "الأسرة": "Family Court, Cairo, Egypt"
};

// Precise fallback estimates (duration, distance) in Arabic for local Cairo conditions
const getFallbackEstimate = (courtName: string) => {
  const name = courtName.toLowerCase();
  if (name.includes("اقتصادية") || name.includes("المحكمة الاقتصادية")) {
    return { duration: "١٠ دقائق", distance: "٤.٥ كم", source: "سجل التقديرات المحلّية" };
  }
  if (name.includes("نقض") || name.includes("القضاء العالي") || name.includes("دار القضاء")) {
    return { duration: "٣٠ دقيقة", distance: "١٤ كم", source: "سجل التقديرات المحلّية" };
  }
  if (name.includes("شمال القاهرة") || name.includes("عباسية") || name.includes("العباسية")) {
    return { duration: "٣٥ دقيقة", distance: "١٨ كم", source: "سجل التقديرات المحلّية" };
  }
  if (name.includes("جنوب القاهرة") || name.includes("باب الخلق")) {
    return { duration: "٢٨ دقيقة", distance: "١٣ كم", source: "سجل التقديرات المحلّية" };
  }
  if (name.includes("استئناف") || name.includes("التجمع") || name.includes("التجمع الخامس")) {
    return { duration: "٣٢ دقيقة", distance: "٢٢ كم", source: "سجل التقديرات المحلّية" };
  }
  if (name.includes("مجلس الدولة") || name.includes("الدقي")) {
    return { duration: "٢٥ دقيقة", distance: "١٢ كم", source: "سجل التقديرات المحلّية" };
  }
  // Default general Cairo estimate from Maadi
  return { duration: "٣٠ دقيقة", distance: "١٥ كم", source: "سجل التقديرات المحلّية" };
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courtParam = searchParams.get("court") || "";
    
    if (!courtParam) {
      return NextResponse.json({ error: "Missing court parameter" }, { status: 400 });
    }

    const fallback = getFallbackEstimate(courtParam);

    // Retrieve API key securely on the server
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ...fallback,
        status: "FALLBACK_NO_API_KEY"
      });
    }

    // Match court to specific address
    let destinationAddress = `${courtParam}, Cairo, Egypt`;
    for (const [key, value] of Object.entries(COURT_MAPPINGS)) {
      if (courtParam.includes(key)) {
        destinationAddress = value;
        break;
      }
    }

    const originAddress = "Maadi, Cairo, Egypt";
    
    // Call Google Maps Distance Matrix API in Arabic
    const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originAddress)}&destinations=${encodeURIComponent(destinationAddress)}&key=${apiKey}&language=ar`;
    
    const response = await fetch(mapsUrl);
    if (!response.ok) {
      return NextResponse.json({
        ...fallback,
        status: "FALLBACK_API_ERROR"
      });
    }

    const data = await response.json();
    
    if (data.status === "OK" && data.rows?.[0]?.elements?.[0]?.status === "OK") {
      const element = data.rows[0].elements[0];
      const distanceText = element.distance.text;
      const durationText = element.duration.text;
      
      return NextResponse.json({
        duration: durationText,
        distance: distanceText,
        source: "خرائط Google",
        status: "OK"
      });
    }

    return NextResponse.json({
      ...fallback,
      status: "FALLBACK_PARSE_ERROR"
    });

  } catch (error) {
    console.error("Travel Time Route Error:", error);
    return NextResponse.json({
      duration: "٣٠ دقيقة",
      distance: "١٥ كم",
      source: "سجل التقديرات المحلّية",
      status: "FALLBACK_EXCEPTION"
    });
  }
}
