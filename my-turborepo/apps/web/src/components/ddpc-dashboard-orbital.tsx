"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Logo } from "@repo/ui/logo";
import { useRouter } from "next/navigation";

interface DashboardNode {
  id: number;
  title: string;
  route: string;
  description: string;
  icon: React.ElementType;
  category: string;
  relatedIds: number[];
  status: "available" | "featured" | "new";
  color: string;
}

interface DDPCDashboardOrbitalProps {
  nodes: DashboardNode[];
}

export default function DDPCDashboardOrbital({
  nodes,
}: DDPCDashboardOrbitalProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const router = useRouter();

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = nodes.findIndex((item) => item.id === nodeId);
    const totalNodes = nodes.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 250;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = 1;

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = nodes.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const nodeSize = 75;
  const logoSize = 75;

  return (
    <div
      className="w-[800px] h-[800px] flex flex-col items-center justify-center relative"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* DDPC Logo Center */}
          <div
            className="absolute rounded-full bg-black border-2 border-red-500/50 flex items-center justify-center z-10 shadow-lg"
            style={{ width: 150, height: 150 }}
          >
            <Logo size={100} />
            <div
              className="absolute rounded-full border border-red-500/30 animate-ping opacity-50"
              style={{ width: 170, height: 170 }}
            ></div>
          </div>

          {nodes.map((node, index) => {
            const position = calculateNodePosition(index, nodes.length);
            const isExpanded = expandedItems[node.id];
            const isRelated = isRelatedToActive(node.id);
            const isPulsing = pulseEffect[node.id];
            const Icon = node.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={node.id}
                ref={(el) => { nodeRefs.current[node.id] = el; }}
                className="absolute transition-transform duration-300 cursor-pointer hover:scale-110"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(node.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, ${node.color}20 0%, transparent 70%)`,
                    width: 94,
                    height: 94,
                    left: -9.5,
                    top: -9.5,
                  }}
                ></div>

                <div
                  className={`
                  rounded-full flex items-center justify-center
                  ${isExpanded ? "text-black" : "text-white"}
                  border-2
                  ${isExpanded ? "border-white shadow-lg shadow-white/20" : "border-gray-600"}
                  transition-all duration-300 transform
                  ${isExpanded ? "scale-125" : ""}
                  ${isRelated ? "animate-pulse border-white/60" : ""}
                `}
                  style={{ 
                    backgroundColor: isExpanded ? 'white' : node.color,
                    width: 75,
                    height: 75,
                  }}
                >
                  <Icon size={40} />
                </div>

                <div
                  className={`
                  absolute whitespace-nowrap
                  text-lg font-semibold tracking-wider
                  transition-all duration-300
                  left-1/2 -translate-x-1/2
                  ${isExpanded ? "text-white scale-110" : "text-gray-400"}
                `}
                  style={{ top: 90 }}
                >
                  {node.title}
                </div>

                {isExpanded && (
                  <Card 
                    className="absolute left-1/2 -translate-x-1/2 w-72 bg-gray-900/95 backdrop-blur-lg border-gray-600 shadow-xl shadow-black/50 overflow-visible"
                    style={{ top: 120 }}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-gray-500"></div>
                    
                    {/* Scrutineer Coming Soon Badge - overlaying modal */}
                    {node.title === "Scrutineer" && (
                      <div className="absolute -top-3 -right-3 z-50">
                        <Badge 
                          className="px-3 py-1 text-sm font-bold animate-pulse shadow-[0_0_10px_theme(colors.green.500)] border-green-400 text-green-400 bg-black/80 dark:text-green-400 dark:border-green-400 dark:shadow-[0_0_10px_theme(colors.green.500)] light:text-blue-500 light:border-blue-500 light:shadow-[0_0_10px_theme(colors.blue.500)]"
                        >
                          Coming Soon
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-lg text-white text-center">
                        {node.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-300 text-center pb-4">
                      <p className="mb-4 leading-relaxed">{node.description}</p>

                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-600 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(node.route);
                          }}
                        >
                          Visit Page
                          <ArrowRight size={14} className="ml-2" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-3 hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItem(node.id);
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
