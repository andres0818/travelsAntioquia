import React, { useMemo } from 'react';
import * as topojson from 'topojson-client';
import { geoPath, geoMercator } from 'd3-geo';
import antioquiaData from '../data/antioquia-municipios.json';

interface Municipality {
  id: string;
  properties: {
    name: string;
    dpt: string;
  };
  geometry: any;
}

interface MapAntioquiaProps {
  onMunicipalityClick: (id: string, name: string) => void;
  onMunicipalityHover?: (name: string | null) => void;
  visitedTowns?: Record<string, { mainImageUrl: string }>;
}

const MapAntioquia: React.FC<MapAntioquiaProps> = ({ 
  onMunicipalityClick, 
  onMunicipalityHover,
  visitedTowns = {} 
}) => {
  const municipalities = useMemo(() => {
    // @ts-ignore
    const features = topojson.feature(antioquiaData, antioquiaData.objects.mpios).features;
    return features as unknown as Municipality[];
  }, []);

  const projection = useMemo(() => {
    return geoMercator().fitSize([800, 800], {
      type: 'FeatureCollection',
      features: municipalities.map(m => ({
        type: 'Feature',
        geometry: m.geometry,
        properties: m.properties
      }))
    } as any);
  }, [municipalities]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  return (
    <div className="relative w-full h-full bg-black/40 rounded-[2.5rem] overflow-hidden">
      <svg
        viewBox="0 0 800 800"
        className="w-full h-full p-4"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {Object.entries(visitedTowns).map(([id, data]) => (
            <pattern
              key={`pattern-${id}`}
              id={`pattern-${id}`}
              patternUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <image
                href={data.mainImageUrl}
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#glow)">
          {municipalities.map((m) => {
            const isVisited = !!visitedTowns[m.id];
            return (
              <path
                key={m.id}
                d={pathGenerator(m.geometry) || ''}
                fill={isVisited ? `url(#pattern-${m.id})` : '#0f172a'}
                stroke={isVisited ? '#10b981' : '#1e293b'}
                strokeWidth={isVisited ? '1.5' : '0.5'}
                className="transition-all duration-300 cursor-pointer hover:fill-emerald-500/20 hover:stroke-emerald-400 hover:stroke-[2px] outline-none"
                onClick={() => onMunicipalityClick(m.id, m.properties.name)}
                onMouseEnter={() => onMunicipalityHover?.(m.properties.name)}
                onMouseLeave={() => onMunicipalityHover?.(null)}
              >
                <title>{m.properties.name}</title>
              </path>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default MapAntioquia;
