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
    const radius = 180;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.5,
      Math.min(1, 0.5 + 0.5 * ((1 + Math.sin(radian)) / 2))
    );

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

  const getStatusStyles = (status: DashboardNode["status"]): string => {
    switch (status) {
      case "available":
        return "text-white bg-gray-600 border-gray-500";
      case "featured":
        return "text-white bg-blue-600 border-blue-500";
      case "new":
        return "text-white bg-green-600 border-green-500";
      default:
        return "text-white bg-gray-600 border-gray-500";
    }
  };

  const getStatusLabel = (status: DashboardNode["status"]): string => {
    switch (status) {
      case "available":
        return "AVAILABLE";
      case "featured":
        return "FEATURED";
      case "new":
        return "NEW";
      default:
        return "AVAILABLE";
    }
  };

  return (
    <div
      className="w-full h-96 flex flex-col items-center justify-center overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* DDPC Logo Center */}
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 flex items-center justify-center z-10 shadow-lg">
            <div className="w-12 h-12 flex items-center justify-center">
              <Logo />
            </div>
            <div className="absolute w-24 h-24 rounded-full border border-gray-500/30 animate-ping opacity-50"></div>
            <div
              className="absolute w-28 h-28 rounded-full border border-gray-400/20 animate-ping opacity-30"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>

          {/* Orbital Ring */}
          <div className="absolute w-80 h-80 rounded-full border border-gray-600/20"></div>

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
                className="absolute transition-all duration-700 cursor-pointer"
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
                    width: "60px",
                    height: "60px",
                    left: "-30px",
                    top: "-30px",
                  }}
                ></div>

                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${isExpanded ? "bg-white text-black" : "bg-gray-800 text-white"}
                  border-2
                  ${isExpanded ? "border-white shadow-lg shadow-white/20" : "border-gray-600"}
                  transition-all duration-300 transform
                  ${isExpanded ? "scale-125" : ""}
                  ${isRelated ? "animate-pulse border-white/60" : ""}
                `}
                >
                  <Icon size={20} />
                </div>

                <div
                  className={`
                  absolute top-14 whitespace-nowrap
                  text-xs font-semibold tracking-wider
                  transition-all duration-300
                  ${isExpanded ? "text-white scale-110" : "text-gray-400"}
                `}
                >
                  {node.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-20 left-1/2 -translate-x-1/2 w-72 bg-gray-900/95 backdrop-blur-lg border-gray-600 shadow-xl shadow-black/50 overflow-visible">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-gray-500"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 text-xs ${getStatusStyles(node.status)}`}
                        >
                          {getStatusLabel(node.status)}
                        </Badge>
                        <span className="text-xs font-mono text-gray-400">
                          {node.category}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-2 text-white">
                        {node.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-gray-300">
                      <p className="mb-4">{node.description}</p>

                      <div className="flex gap-2">
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
                          <ArrowRight size={12} className="ml-1" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 hover:bg-gray-800"
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