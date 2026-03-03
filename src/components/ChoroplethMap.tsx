import { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

// Using a lightweight topojson for world countries
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ChoroplethMapProps {
    data: { location: string; value: number }[];
}

// Minimal matching heuristic to link country codes/names loosely
const normalizeLocation = (loc: string) => loc.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function ChoroplethMap({ data }: ChoroplethMapProps) {
    // Create lookup dictionary — must be called BEFORE any early returns (hooks rules)
    const dataMap = useMemo(() => {
        const map: Record<string, number> = {};
        for (const d of data) {
            map[normalizeLocation(d.location)] = d.value;
        }
        return map;
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground w-full h-[350px]">
                No geographic data to render. Try selecting a column containing Country names or codes.
            </div>
        );
    }

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    const colorScale = scaleLinear<string>()
        .domain([minVal, maxVal])
        .range(["#eff6ff", "#1d4ed8"]); // Light blue to dark blue

    return (
        <div className="w-full" style={{ aspectRatio: 16 / 9, maxHeight: 400 }}>
            <ComposableMap
                projectionConfig={{
                    rotate: [-10, 0, 0],
                    scale: 147,
                }}
                className="w-full h-full"
            >
                <Sphere stroke="hsl(var(--border))" strokeWidth={0.5} id="sphere" fill="transparent" />
                <Graticule stroke="hsl(var(--border))" strokeWidth={0.5} />
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            // Try to find a match either by 3-letter ISO code or full country name
                            const normName = normalizeLocation(geo.properties.name);
                            const normA3 = geo.id ? normalizeLocation(geo.id) : "";

                            const d = dataMap[normName] || dataMap[normA3];

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={d ? colorScale(d) : "hsl(var(--muted))"}
                                    stroke="hsl(var(--background))"
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#3b82f6", outline: "none", cursor: "pointer" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
            <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
                <span>Min: {minVal.toLocaleString()}</span>
                <span>Max: {maxVal.toLocaleString()}</span>
            </div>
        </div>
    );
}
