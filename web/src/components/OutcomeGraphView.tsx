import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import "./OutcomeGraphView.css";
import { ApiError, getSessionOutcomeGraphDraft } from "../api";
import type {
  OutcomeGraphDraft,
  OutcomeLineageFrame,
  OutcomeLineageRelation,
  OutcomeResultCard,
  OutcomeStatus,
} from "../types";

type OutcomeGraphNodeData =
  | {
    kind: "result";
    card: OutcomeResultCard;
    selected: boolean;
    onSelect: (cardId: string) => void;
  }
  | {
    kind: "upstream" | "goal";
    frame: OutcomeLineageFrame;
  };

type OutcomeGraphNode = Node<OutcomeGraphNodeData, "outcome" | "frame">;

const STATUS_LABELS: Record<OutcomeStatus, string> = {
  done: "已完成",
  partial: "部分完成",
  blocked: "安全阻塞",
};

function pointerLabel(pointer: string) {
  if (pointer.startsWith("codex://threads/")) return `原 session · ${pointer.slice("codex://threads/".length, 21)}`;
  const name = pointer.split("/").filter(Boolean).at(-1);
  return name ?? pointer;
}

function OutcomeNode({ data }: NodeProps<OutcomeGraphNode>) {
  if (data.kind !== "result") {
    return (
      <article className={`outcome-graph-frame outcome-graph-frame-${data.kind}`}>
        {data.kind === "goal" && <Handle type="target" position={Position.Top} isConnectable={false} />}
        <span>{data.kind === "upstream" ? "工作起因" : "未完成目标"}</span>
        <h3>{data.frame.title}</h3>
        <p>{data.frame.summary}</p>
        {data.kind === "upstream" && <Handle type="source" position={Position.Right} isConnectable={false} />}
      </article>
    );
  }
  const { card, selected, onSelect } = data;
  return (
    <article
      className={`outcome-graph-node status-${card.status}${selected ? " selected" : ""}`}
      onClick={() => onSelect(card.id)}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <header>
        <span className="outcome-graph-node-status">{STATUS_LABELS[card.status]}</span>
        <span className="outcome-graph-node-confidence">证据 {card.confidence}</span>
      </header>
      <h3>{card.title}</h3>
      <p>{card.outcome}</p>
      <footer>
        <span>{card.outcomeUnits.length} 个结果单元</span>
        <span>原 session 证据</span>
      </footer>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </article>
  );
}

const NODE_TYPES = { outcome: OutcomeNode, frame: OutcomeNode };

function candidateRelationCards(
  relations: OutcomeLineageRelation[],
  cards: OutcomeResultCard[],
) {
  const unitOwners = new Map<string, OutcomeResultCard>();
  for (const card of cards) {
    for (const unit of card.outcomeUnits) unitOwners.set(unit.id, card);
  }
  return relations.filter((relation) => (
    relation.status === "candidate"
    && relation.fromUnitId
    && relation.toUnitId
    && unitOwners.has(relation.fromUnitId)
    && unitOwners.has(relation.toUnitId)
  ));
}

function cardForUnit(cards: OutcomeResultCard[], unitId?: string) {
  if (!unitId) return null;
  return cards.find((card) => card.outcomeUnits.some((unit) => unit.id === unitId)) ?? null;
}

export function OutcomeGraphView() {
  const [draft, setDraft] = useState<OutcomeGraphDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCandidateRationale, setShowCandidateRationale] = useState(false);
  const flowRef = useRef<ReactFlowInstance<OutcomeGraphNode, Edge> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getSessionOutcomeGraphDraft(controller.signal)
      .then((nextDraft) => {
        setDraft(nextDraft);
        setActiveWorkId(nextDraft.parentWorkCandidates[0]?.id ?? null);
        setSelectedCardId(nextDraft.resultCards[0]?.id ?? null);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        if (requestError instanceof ApiError && requestError.code === "OUTCOME_GRAPH_DRAFT_NOT_FOUND") {
          setError("本机尚未生成结果血缘验证草案。");
          return;
        }
        setError("结果血缘草案暂时无法读取。");
      });
    return () => controller.abort();
  }, []);

  const activeCards = useMemo(() => (
    draft?.resultCards.filter((card) => card.parentWorkId === activeWorkId) ?? []
  ), [activeWorkId, draft]);

  useEffect(() => {
    if (activeCards.some((card) => card.id === selectedCardId)) return;
    setSelectedCardId(activeCards[0]?.id ?? null);
  }, [activeCards, selectedCardId]);

  const selectedCard = activeCards.find((card) => card.id === selectedCardId) ?? activeCards[0] ?? null;
  const primaryRelations = useMemo(() => (
    (draft?.lineageRelations ?? []).filter((relation) => (
      relation.status === "evidence_backed"
      && relation.defaultVisibility === "primary"
      && activeCards.some((card) => card.id === relation.fromResultId)
      && activeCards.some((card) => card.id === relation.toResultId)
    ))
  ), [activeCards, draft]);
  const candidateRelations = useMemo(() => (
    candidateRelationCards(draft?.lineageRelations ?? [], activeCards)
  ), [activeCards, draft]);

  const nodes = useMemo<OutcomeGraphNode[]>(() => {
    const activeWork = draft?.parentWorkCandidates.find((work) => work.id === activeWorkId);
    const hasSingleCard = activeCards.length === 1;
    const frames: OutcomeGraphNode[] = [];
    if (activeWork?.upstreamContext) {
      frames.push({
        id: `upstream-${activeWork.id}`,
        type: "frame",
        position: { x: 0, y: hasSingleCard ? 115 : 110 },
        data: { kind: "upstream", frame: activeWork.upstreamContext },
      });
    }
    if (activeWork?.downstreamGoal) {
      frames.push({
        id: `goal-${activeWork.id}`,
        type: "frame",
        position: { x: 280, y: hasSingleCard ? 360 : 485 },
        data: { kind: "goal", frame: activeWork.downstreamGoal },
      });
    }
    if (activeCards.length === 1) {
      const [card] = activeCards;
      const resultNode: OutcomeGraphNode = {
        id: card.id,
        type: "outcome",
        position: { x: 280, y: 55 },
        data: { kind: "result", card, selected: card.id === selectedCard?.id, onSelect: setSelectedCardId },
      };
      return [...frames, resultNode];
    }
    const continuationSourceIds = new Set(primaryRelations.map((relation) => relation.fromResultId));
    const continuationTargetIds = new Set(primaryRelations.map((relation) => relation.toResultId));
    const sideCards = activeCards.filter((card) => (
      !continuationSourceIds.has(card.id) && !continuationTargetIds.has(card.id)
    ));
    const resultNodes: OutcomeGraphNode[] = activeCards.map((card, index) => {
      const position = continuationSourceIds.has(card.id)
        ? { x: 280, y: 25 }
        : continuationTargetIds.has(card.id)
          ? { x: 280, y: 250 }
          : { x: 0, y: 405 + Math.max(0, sideCards.findIndex((item) => item.id === card.id)) * 240 };
      return {
        id: card.id,
        type: "outcome",
        position: index === 0 && !continuationSourceIds.size ? { x: 280, y: 25 } : position,
        data: { kind: "result", card, selected: card.id === selectedCard?.id, onSelect: setSelectedCardId },
      };
    });
    return [...resultNodes, ...frames];
  }, [activeCards, activeWorkId, draft?.parentWorkCandidates, primaryRelations, selectedCard?.id]);

  const edges = useMemo<Edge[]>(() => {
    const activeWork = draft?.parentWorkCandidates.find((work) => work.id === activeWorkId);
    const primaryStartCardId = primaryRelations[0]?.fromResultId ?? activeCards[0]?.id;
    const primaryEndCardId = primaryRelations[0]?.toResultId ?? activeCards[0]?.id;
    const contextEdge = activeWork?.upstreamContext && primaryStartCardId
      ? [{
        id: `upstream-edge-${activeWork.id}`,
        source: `upstream-${activeWork.id}`,
        target: primaryStartCardId,
        label: "先厘清可信边界",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#9b6a2f" },
        style: { stroke: "#9b6a2f", strokeWidth: 1.5 },
        labelStyle: { fill: "#805122", fontSize: 11, fontWeight: 650 },
        labelBgStyle: { fill: "#fcfcfd", fillOpacity: 0.94 },
        labelBgPadding: [6, 4] as [number, number],
      }] satisfies Edge[]
      : [];
    const goalEdge = activeWork?.downstreamGoal && primaryEndCardId
      ? [{
        id: `goal-edge-${activeWork.id}`,
        source: primaryEndCardId,
        target: `goal-${activeWork.id}`,
        label: "补证据后才可回灌",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#7c8797" },
        style: { stroke: "#7c8797", strokeWidth: 1.5, strokeDasharray: "5 5" },
        labelStyle: { fill: "#596575", fontSize: 11, fontWeight: 650 },
        labelBgStyle: { fill: "#fcfcfd", fillOpacity: 0.94 },
        labelBgPadding: [6, 4] as [number, number],
      }] satisfies Edge[]
      : [];
    const lineageEdges = primaryRelations.flatMap((relation) => {
    if (!relation.fromResultId || !relation.toResultId) return [];
    return [{
      id: relation.id,
      source: relation.fromResultId,
      target: relation.toResultId,
      label: "方法延续 · 有原文交接",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#476b9e" },
      style: { stroke: "#476b9e", strokeWidth: 1.8 },
      labelStyle: { fill: "#35547f", fontSize: 11, fontWeight: 650 },
      labelBgStyle: { fill: "#fcfcfd", fillOpacity: 0.94 },
      labelBgPadding: [6, 4] as [number, number],
    }];
    });
    return [...contextEdge, ...lineageEdges, ...goalEdge];
  }, [activeCards, activeWorkId, draft?.parentWorkCandidates, primaryRelations]);

  useEffect(() => {
    if (!flowRef.current || nodes.length === 0) return;
    const outerFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        void flowRef.current?.fitView({ padding: 0.16, maxZoom: 0.92, duration: 0 });
      });
    });
    return () => window.cancelAnimationFrame(outerFrame);
  }, [activeWorkId, nodes]);

  if (!draft && !error) {
    return <div className="outcome-graph-loading">正在整理结果血缘草案…</div>;
  }
  if (!draft || !activeWorkId) {
    return <div className="outcome-graph-empty">{error ?? "没有可展示的结果血缘草案。"}</div>;
  }

  const activeWork = draft.parentWorkCandidates.find((work) => work.id === activeWorkId);

  return (
    <section className="outcome-graph-view" aria-label="结果血缘验证">
      <header className="outcome-graph-heading">
        <div>
          <span className="outcome-graph-eyebrow">Session Outcome Graph · 验证版</span>
          <h1>结果不是对话，session 只是证据</h1>
          <p>默认只画有原文交接依据的主线。相似主题、同一 session 或同一目录，不会自动被画成依赖。</p>
        </div>
        <span className="outcome-graph-readonly">只读草案 · 未写入任务库</span>
      </header>

      <div className="outcome-graph-work-switcher" role="tablist" aria-label="父工作">
        {draft.parentWorkCandidates.map((work) => (
          <button
            type="button"
            role="tab"
            aria-selected={work.id === activeWorkId}
            className={work.id === activeWorkId ? "active" : ""}
            key={work.id}
            onClick={() => {
              setActiveWorkId(work.id);
              setShowCandidateRationale(false);
            }}
          >
            <span>{work.title}</span>
            <small>{draft.resultCards.filter((card) => card.parentWorkId === work.id).length} 张结果卡</small>
          </button>
        ))}
      </div>

      <div className="outcome-graph-work-note">
        <strong>{activeWork?.title}</strong>
        <span>{activeWork?.reason}</span>
      </div>

      <div className="outcome-graph-layout">
        <div className="outcome-graph-canvas-wrap">
          <div className="outcome-graph-canvas-header">
            <div>
              <strong>血缘主线</strong>
              <span>实线 = 已有证据的延续；虚线 = 尚未完成目标，不是候选事实</span>
            </div>
            {candidateRelations.length > 0 && (
              <button
                type="button"
                className={`outcome-graph-candidate-toggle${showCandidateRationale ? " active" : ""}`}
                onClick={() => setShowCandidateRationale((current) => !current)}
              >
                {showCandidateRationale ? "收起" : "展开"} {candidateRelations.length} 条候选依据
              </button>
            )}
          </div>
          <div className="outcome-graph-canvas">
            <ReactFlow<OutcomeGraphNode, Edge>
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              minZoom={0.48}
              maxZoom={1.25}
              nodesDraggable={false}
              nodesConnectable={false}
              connectOnClick={false}
              panOnScroll
              panOnDrag
              zoomOnDoubleClick={false}
              proOptions={{ hideAttribution: true }}
              onInit={(instance) => {
                flowRef.current = instance;
                window.requestAnimationFrame(() => {
                  void instance.fitView({ padding: 0.16, maxZoom: 0.92, duration: 0 });
                });
              }}
            >
              <Background color="var(--border-strong)" gap={24} size={0.65} variant={BackgroundVariant.Dots} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
          {showCandidateRationale && (
            <div className="outcome-graph-candidate-list">
              {candidateRelations.map((relation) => {
                const fromCard = cardForUnit(activeCards, relation.fromUnitId);
                const toCard = cardForUnit(activeCards, relation.toUnitId);
                const fromUnit = fromCard?.outcomeUnits.find((unit) => unit.id === relation.fromUnitId);
                const toUnit = toCard?.outcomeUnits.find((unit) => unit.id === relation.toUnitId);
                return (
                  <article key={relation.id}>
                    <span className="outcome-graph-candidate-type">{relation.relation}</span>
                    <strong>{fromUnit?.title} → {toUnit?.title}</strong>
                    <p>{relation.rationale}</p>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {selectedCard && (
          <aside className="outcome-graph-inspector" aria-label="结果卡详情">
            <div className="outcome-graph-inspector-head">
              <span className={`outcome-graph-status-dot status-${selectedCard.status}`} />
              <span>{STATUS_LABELS[selectedCard.status]}</span>
              <span>证据 {selectedCard.confidence}</span>
            </div>
            <h2>{selectedCard.title}</h2>
            <p className="outcome-graph-outcome">{selectedCard.outcome}</p>

            <dl className="outcome-graph-context">
              <div><dt>为什么做</dt><dd>{selectedCard.workContext.trigger}</dd></div>
              <div><dt>要达成什么</dt><dd>{selectedCard.workContext.goal}</dd></div>
              <div><dt>怎样算结束</dt><dd>{selectedCard.workContext.finishDefinition}</dd></div>
              <div><dt>实际停在哪</dt><dd>{selectedCard.workContext.actualStopPoint}</dd></div>
              <div className="misread"><dt>不要误解为</dt><dd>{selectedCard.workContext.notToBeMisreadAs}</dd></div>
            </dl>

            <section className="outcome-graph-units">
              <h3>结果单元</h3>
              {selectedCard.outcomeUnits.map((unit) => (
                <article key={unit.id}>
                  <strong>{unit.title}</strong>
                  <p>{unit.summary}</p>
                </article>
              ))}
            </section>

            <section className="outcome-graph-evidence">
              <h3>原始证据指针</h3>
              {selectedCard.evidencePointers.map((pointer) => (
                pointer.startsWith("codex://")
                  ? <a href={pointer} key={pointer}>{pointerLabel(pointer)}</a>
                  : <code key={pointer} title={pointer}>{pointerLabel(pointer)}</code>
              ))}
            </section>
            <div className="outcome-graph-next-step"><strong>下一步</strong><span>{selectedCard.nextStep}</span></div>
          </aside>
        )}
      </div>
    </section>
  );
}
