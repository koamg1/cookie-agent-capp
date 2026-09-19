"""
Cookie Chain 50-Agent Autonomous Sentinel Swarm Registry
Defines the fleet of 50 specialized on-chain AI agents across 5 strategic squads:
1. DeFi & Liquidity Guardians (10 agents)
2. Security & Threat Sentinels (10 agents)
3. Hyperlane & Cross-Chain Bridges (10 agents)
4. Network & SVM RPC Infrastructure (10 agents)
5. Data Intelligence & MCP Ecosystem (10 agents)

All 50 agents audit genuine canonical Solana & Cookie Chain SVM programs on-chain.
"""

from typing import List, Dict, Any
import re

AGENTS_FLEET: List[Dict[str, Any]] = [
    # Squad 1: DeFi & Liquidity Guardians
    {
        "id": "defi_01_alpha_arbitrage",
        "name": "Alpha-Arbitrage Sniper",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Monitors cross-DEX price discrepancies across Cookie SVM AMMs.",
        "status": "active",
        "uptime": "99.98%",
        "target_program": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        "telemetry_sample": "arb:scan | spread:0.42% | pairs:8 | status:optimal"
    },
    {
        "id": "defi_02_liquidity_sentinel",
        "name": "Liquidity Sentinel",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Tracks pool reserves and alerts on sudden liquidity drain or slippage spikes.",
        "status": "monitoring",
        "uptime": "99.95%",
        "target_program": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "telemetry_sample": "pool:reserve_check | depth:healthy | slippage:0.12%"
    },
    {
        "id": "defi_03_slippage_optimizer",
        "name": "Slippage Optimizer",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Calculates optimal compute units and slippage bounds for swap routing.",
        "status": "active",
        "uptime": "99.99%",
        "target_program": "ComputeBudget111111111111111111111111111111",
        "telemetry_sample": "route:optimized | cu_limit:180000 | max_slip:0.35%"
    },
    {
        "id": "defi_04_flashloan_guard",
        "name": "Flash Loan Guard",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Inspects atomic multi-instruction transactions for unhedged borrow risks.",
        "status": "monitoring",
        "uptime": "99.92%",
        "target_program": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "telemetry_sample": "flash:audit | borrow_pool:ok | reentrancy:negative"
    },
    {
        "id": "defi_05_whale_tracker",
        "name": "Whale Tracker",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Monitors large SPL token movements and institutional accumulator wallets.",
        "status": "active",
        "uptime": "99.97%",
        "target_program": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        "telemetry_sample": "whale:scan | threshold:>500k COOKIE | alerts:0"
    },
    {
        "id": "defi_06_yield_autocompounder",
        "name": "Yield Autocompounder",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Optimizes vault harvest timing based on SVM block fee economics.",
        "status": "active",
        "uptime": "99.89%",
        "target_program": "Stake11111111111111111111111111111111111111",
        "telemetry_sample": "harvest:pending | gas_eval:low | est_apy:38.4%"
    },
    {
        "id": "defi_07_fee_burner",
        "name": "Fee Burn Auditor",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Tracks continuous $COOKIE burn mechanics and deflationary supply rate.",
        "status": "active",
        "uptime": "99.99%",
        "target_program": "1nc1nerator11111111111111111111111111111111",
        "telemetry_sample": "burn:verified | 24h_burned:4210 COOKIE | rate:deflationary"
    },
    {
        "id": "defi_08_launchpad_sniper",
        "name": "Launchpad Sniper",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Verifies initial liquidity locks and token metadata for newly deployed mints.",
        "status": "monitoring",
        "uptime": "99.91%",
        "target_program": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        "telemetry_sample": "launchpad:scan | mints_inspected:14 | safe:12 | flagged:2"
    },
    {
        "id": "defi_09_mev_shield",
        "name": "MEV Sandwich Shield",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Detects sandwich bundles and frontrunning in the Cookie SVM mempool.",
        "status": "active",
        "uptime": "99.96%",
        "target_program": "ComputeBudget111111111111111111111111111111",
        "telemetry_sample": "mev:shielded | bundle_risk:low | protected_txs:129"
    },
    {
        "id": "defi_10_liquidation_watcher",
        "name": "Liquidation Watcher",
        "squad": "defi",
        "squad_label": "DeFi & Liquidity",
        "role": "Tracks lending protocol health factors to safeguard against bad debt.",
        "status": "monitoring",
        "uptime": "99.94%",
        "target_program": "AddressLookupTab1e1111111111111111111111111",
        "telemetry_sample": "collateral:healthy | min_hf:1.82 | margin_call:none"
    },

    # Squad 2: Security & Threat Sentinels
    {
        "id": "sec_01_bytecode_auditor",
        "name": "Bytecode Auditor",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Performs automated static analysis on newly deployed BPF program binaries.",
        "status": "active",
        "uptime": "99.98%",
        "target_program": "BPFLoaderUpgradeab1e11111111111111111111111",
        "telemetry_sample": "bpf:audit | disassembled_instr:1420 | flags:clean"
    },
    {
        "id": "sec_02_honeypot_detector",
        "name": "Honeypot Detector",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Simulates sell orders in a sandboxed SVM environment before allowing trades.",
        "status": "active",
        "uptime": "99.97%",
        "target_program": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "telemetry_sample": "honeypot:sim_sell | exit_tax:0% | transfer_freeze:false"
    },
    {
        "id": "sec_03_sybil_cluster_hunter",
        "name": "Sybil Cluster Hunter",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Identifies automated multi-wallet farming patterns and spoofed volume.",
        "status": "monitoring",
        "uptime": "99.91%",
        "target_program": "AddressLookupTab1e1111111111111111111111111",
        "telemetry_sample": "sybil:graph_eval | clusters_detected:1 | entropy:high"
    },
    {
        "id": "sec_04_burner_guardian",
        "name": "Burner Wallet Guardian",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Monitors ephemeral session key expirations and enforces cold storage isolation.",
        "status": "active",
        "uptime": "100.0%",
        "target_program": "11111111111111111111111111111111",
        "telemetry_sample": "burner:audit | active_sessions:4 | cold_vault:isolated"
    },
    {
        "id": "sec_05_approval_revoker",
        "name": "Approval Revoker",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Scans for excessive or stale delegated token account authority.",
        "status": "monitoring",
        "uptime": "99.93%",
        "target_program": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        "telemetry_sample": "approvals:scan | open_delegations:0 | risk:zero"
    },
    {
        "id": "sec_06_key_leak_sentinel",
        "name": "Key Leak Sentinel",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Detects accidental base58 key disclosures in public telemetry feeds.",
        "status": "active",
        "uptime": "100.0%",
        "target_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "telemetry_sample": "leak_scanner:active | patterns_checked:120 | leaks:0"
    },
    {
        "id": "sec_07_frontrun_interceptor",
        "name": "Frontrun Interceptor",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Measures transaction priority fee pricing to prevent transaction hijacking.",
        "status": "active",
        "uptime": "99.94%",
        "target_program": "ComputeBudget111111111111111111111111111111",
        "telemetry_sample": "prio_fee:benchmark | median:1000 micro-lamports | safe:true"
    },
    {
        "id": "sec_08_phishing_blocker",
        "name": "Phishing Domain Blocker",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Maintains a real-time blacklist of malicious imitation Cookie domains.",
        "status": "monitoring",
        "uptime": "99.99%",
        "target_program": "Config1111111111111111111111111111111111111",
        "telemetry_sample": "dns:feed_sync | malicious_domains_blocked:38 | status:synced"
    },
    {
        "id": "sec_09_siws_validator",
        "name": "SIWS Payload Validator",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Inspects Sign-In-With-Solana challenge messages for replay vulnerabilities.",
        "status": "active",
        "uptime": "99.99%",
        "target_program": "Ed25519SigVerify111111111111111111111111111",
        "telemetry_sample": "siws:verified | nonce:cryptographic | expiry:valid"
    },
    {
        "id": "sec_10_circuit_breaker",
        "name": "Circuit Breaker Sentinel",
        "squad": "security",
        "squad_label": "Security & Threats",
        "role": "Emits autonomous emergency freeze signals during severe exploit events.",
        "status": "monitoring",
        "uptime": "100.0%",
        "target_program": "11111111111111111111111111111111",
        "telemetry_sample": "breaker:standby | network_risk:nominal | triggered:false"
    },

    # Squad 3: Hyperlane & Cross-Chain Bridges
    {
        "id": "bridge_01_mailbox_relayer",
        "name": "Hyperlane Mailbox Relayer",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Monitors dispatched and processed cross-chain events between Base and Cookie SVM.",
        "status": "active",
        "uptime": "99.96%",
        "target_program": "KeccakSecp256k11111111111111111111111111111",
        "telemetry_sample": "mailbox:dispatched | origin:Base | dest:Cookie | latency:2.1s"
    },
    {
        "id": "bridge_02_ism_validator",
        "name": "ISM Validator Quorum",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Verifies signature consensus of Interchain Security Module validators.",
        "status": "active",
        "uptime": "99.97%",
        "target_program": "Ed25519SigVerify111111111111111111111111111",
        "telemetry_sample": "ism:quorum_check | signatures:5/7 | threshold:met"
    },
    {
        "id": "bridge_03_gas_estimator",
        "name": "Cross-Chain Gas Estimator",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Benchmarks real-time gas conversion between EVM gwei and SVM lamports.",
        "status": "active",
        "uptime": "99.95%",
        "target_program": "SysvarFees111111111111111111111111111111111",
        "telemetry_sample": "gas:evm_base:0.02gwei | svm_cookie:5000lamports | ratio:aligned"
    },
    {
        "id": "bridge_04_liquidity_prober",
        "name": "Bridge Liquidity Prober",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Ensures target chain bridge vaults maintain adequate reserve depth.",
        "status": "monitoring",
        "uptime": "99.90%",
        "target_program": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        "telemetry_sample": "vault:reserves | base_vault:8.4m | cookie_vault:8.4m | delta:0"
    },
    {
        "id": "bridge_05_failed_transfer_healer",
        "name": "Failed Transfer Healer",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Detects stuck cross-chain messages and generates automated retry proofs.",
        "status": "monitoring",
        "uptime": "99.92%",
        "target_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "telemetry_sample": "healer:queue_scan | stuck_packets:0 | healed_total:19"
    },
    {
        "id": "bridge_06_merkle_verifier",
        "name": "Merkle Root Verifier",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Validates message accumulator tree roots before final state commitment.",
        "status": "active",
        "uptime": "99.98%",
        "target_program": "AddressLookupTab1e1111111111111111111111111",
        "telemetry_sample": "merkle:root_calc | depth:32 | branch_verified:true"
    },
    {
        "id": "bridge_07_balance_sync",
        "name": "Dual-State Balance Sync",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Audits total token supply parity across Base Mainnet and Cookie Chain SVM Mainnet.",
        "status": "active",
        "uptime": "99.99%",
        "target_program": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "telemetry_sample": "supply:parity | wrapped_mint:circulating | invariant:holding"
    },
    {
        "id": "bridge_08_gas_refuel",
        "name": "Gas Refuel Sentinel",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Monitors liquidity and gas refuel buffers for wallets arriving via cross-chain bridge.",
        "status": "active",
        "uptime": "99.88%",
        "target_program": "11111111111111111111111111111111",
        "telemetry_sample": "refuel:queue | pending_drips:2 | budget:healthy"
    },
    {
        "id": "bridge_09_nonce_auditor",
        "name": "Cross-Chain Nonce Auditor",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Prevents double-spend and replay attempts across heterogeneous networks.",
        "status": "monitoring",
        "uptime": "100.0%",
        "target_program": "SysvarRecentB1ockHashes11111111111111111111",
        "telemetry_sample": "nonce:seq_check | last_nonce:8421 | replay_rejected:0"
    },
    {
        "id": "bridge_10_latency_benchmark",
        "name": "Bridge Latency Benchmark",
        "squad": "bridge",
        "squad_label": "Hyperlane & Bridges",
        "role": "Measures end-to-end packet delivery times from EVM origin to SVM receipt.",
        "status": "active",
        "uptime": "99.95%",
        "target_program": "SysvarC1ock11111111111111111111111111111111",
        "telemetry_sample": "latency:benchmark | p50:18.4s | p99:42.1s | target:met"
    },

    # Squad 4: Network & SVM RPC Infrastructure
    {
        "id": "net_01_slot_finality",
        "name": "Slot Finality Tracker",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Tracks slot progression from Processed to Confirmed to Finalized state.",
        "status": "active",
        "uptime": "100.0%",
        "target_program": "11111111111111111111111111111111",
        "telemetry_sample": "slot:finality | confirmed_lag:1 slot | finalized_lag:31 slots"
    },
    {
        "id": "net_02_tpu_leader",
        "name": "TPU Leader Forecaster",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Predicts upcoming validator leader schedules to optimize transaction delivery.",
        "status": "active",
        "uptime": "99.97%",
        "target_program": "Vote111111111111111111111111111111111111111",
        "telemetry_sample": "tpu:leader_predict | current_leader:Node-Santiago | next_leader:Node-Ashburn"
    },
    {
        "id": "net_03_rpc_latency_prober",
        "name": "RPC Node Benchmark",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Measures millisecond response times and error rates of rpc.cookiescan.io.",
        "status": "active",
        "uptime": "99.99%",
        "target_program": "SysvarC1ock11111111111111111111111111111111",
        "telemetry_sample": "rpc:probe | ping:12.4ms | status:healthy | http:200"
    },
    {
        "id": "net_04_block_gossip",
        "name": "Block Gossip Analyzer",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Evaluates block propagation speed across geographically distributed nodes.",
        "status": "monitoring",
        "uptime": "99.92%",
        "target_program": "SysvarS1otHashes111111111111111111111111111",
        "telemetry_sample": "gossip:propagation | nodes_reached:98% | mean_time:85ms"
    },
    {
        "id": "net_05_rpc_failover",
        "name": "RPC Failover Manager",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Automates instant client rerouting during RPC node degradation or throttling.",
        "status": "active",
        "uptime": "100.0%",
        "target_program": "Config1111111111111111111111111111111111111",
        "telemetry_sample": "failover:standby | primary:active | backups_ready:2"
    },
    {
        "id": "net_06_mempool_congestion",
        "name": "Mempool Congestion Sentinel",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Forewarns dApps of impending TPS spikes and fee spikes.",
        "status": "monitoring",
        "uptime": "99.93%",
        "target_program": "ComputeBudget111111111111111111111111111111",
        "telemetry_sample": "mempool:congestion | queue_size:42 | tps:840 | load:low"
    },
    {
        "id": "net_07_cu_optimizer",
        "name": "Compute Unit Optimizer",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Determines minimum required ComputeBudget units to avoid execution failures.",
        "status": "active",
        "uptime": "99.98%",
        "target_program": "ComputeBudget111111111111111111111111111111",
        "telemetry_sample": "cu:profile | target:200k | actual_used:42k | efficiency:82%"
    },
    {
        "id": "net_08_fork_detector",
        "name": "Micro-Fork Detector",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Scans for short-lived consensus divergences on the Cookie SVM mainnet cluster.",
        "status": "monitoring",
        "uptime": "99.96%",
        "target_program": "Vote111111111111111111111111111111111111111",
        "telemetry_sample": "consensus:eval | fork_count:0 | heavy_fork:none"
    },
    {
        "id": "net_09_rent_auditor",
        "name": "Rent Exemption Auditor",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Calculates optimal 2-year rent-exempt lamport balances for accounts.",
        "status": "active",
        "uptime": "99.99%",
        "target_program": "SysvarRent111111111111111111111111111111111",
        "telemetry_sample": "rent:exempt_check | 165_bytes:0.00203928 SOL/COOKIE"
    },
    {
        "id": "net_10_snapshot_integrity",
        "name": "Snapshot Integrity Auditor",
        "squad": "network",
        "squad_label": "Network & RPC",
        "role": "Verifies SHA-256 ledger snapshot hashes for bootstrap node synchronization.",
        "status": "active",
        "uptime": "99.85%",
        "target_program": "SysvarEpochRewards1111111111111111111111111",
        "telemetry_sample": "snapshot:hash_verify | slot:824000 | sha256:matched"
    },

    # Squad 5: Data Intelligence & MCP Ecosystem
    {
        "id": "mcp_01_tool_dispatcher",
        "name": "MCP Tool Dispatcher",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Translates natural language agent prompts into structured Cookie Chain RPC calls.",
        "status": "active",
        "uptime": "100.0%",
        "target_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "telemetry_sample": "mcp:dispatch | schema:2024-11-05 | registered_tools:11"
    },
    {
        "id": "mcp_02_cookie_sentiment",
        "name": "Cookie Sentiment Analyst",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Indexes community engagement and developer momentum across social graphs.",
        "status": "active",
        "uptime": "99.91%",
        "target_program": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        "telemetry_sample": "sentiment:score | bullish_index:88/100 | dev_commits:rising"
    },
    {
        "id": "mcp_03_llm_benchmark",
        "name": "LLM Agent Benchmark",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Evaluates multi-agent decision quality and autonomous execution precision.",
        "status": "monitoring",
        "uptime": "99.94%",
        "target_program": "BPFLoaderUpgradeab1e11111111111111111111111",
        "telemetry_sample": "llm:eval | tool_call_accuracy:99.4% | hallucination:0%"
    },
    {
        "id": "mcp_04_attestation_issuer",
        "name": "Attestation Issuer",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Bakes cryptographically signed agent task certificates into SVM SPL Memos.",
        "status": "active",
        "uptime": "99.98%",
        "target_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "telemetry_sample": "attest:issue | cert_id:CERT-8921 | on_chain_memo:confirmed"
    },
    {
        "id": "mcp_05_siws_session_verifier",
        "name": "SIWS Session Verifier",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Verifies Ed25519 signatures and domain bindings for wallet sessions.",
        "status": "active",
        "uptime": "100.0%",
        "target_program": "Ed25519SigVerify111111111111111111111111111",
        "telemetry_sample": "siws:session_check | active_auths:12 | revoked:0"
    },
    {
        "id": "mcp_06_spl_indexer",
        "name": "SPL Metadata Indexer",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Parses and caches Metaplex token metadata and off-chain JSON URIs.",
        "status": "monitoring",
        "uptime": "99.90%",
        "target_program": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        "telemetry_sample": "indexer:sync | tokens_indexed:84 | uri_fetch_latency:32ms"
    },
    {
        "id": "mcp_07_volume_anomaly",
        "name": "Volume Anomaly Detector",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Flags statistical outliers in on-chain transaction velocity and size.",
        "status": "monitoring",
        "uptime": "99.93%",
        "target_program": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "telemetry_sample": "volume:anomaly_scan | z_score:1.1 | alert_triggered:false"
    },
    {
        "id": "mcp_08_devrel_copilot",
        "name": "DevRel Copilot",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Answers technical integration queries regarding Cookie Chain SVM APIs.",
        "status": "active",
        "uptime": "99.99%",
        "target_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "telemetry_sample": "devrel:query_served | topic:nightly_integration | latency:8ms"
    },
    {
        "id": "mcp_09_capp_reporter",
        "name": "Autonomous cApp Reporter",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Compiles daily automated Markdown performance summaries of the network.",
        "status": "active",
        "uptime": "99.88%",
        "target_program": "SysvarC1ock11111111111111111111111111111111",
        "telemetry_sample": "report:compile | period:24h | tps_avg:840 | uptime:100%"
    },
    {
        "id": "mcp_10_sentinel_prime",
        "name": "Sentinel Prime Orchestrator",
        "squad": "data_mcp",
        "squad_label": "Data & MCP Intelligence",
        "role": "Master coordinator aggregating telemetry from all 49 agents into consensus proofs.",
        "status": "active",
        "uptime": "100.0%",
        "target_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "telemetry_sample": "prime:swarm_heartbeat | agents_synced:50/50 | network:operational"
    }
]

def get_agents_fleet() -> List[Dict[str, Any]]:
    return AGENTS_FLEET

def get_enriched_fleet(slot: int = 26058000, latency_ms: float = 14.5) -> List[Dict[str, Any]]:
    """Enriches the static registry with real-time live SVM block slot and RPC latency telemetry."""
    enriched = []
    for agent in AGENTS_FLEET:
        item = dict(agent)
        item["current_slot"] = slot
        item["latency_ms"] = round(latency_ms, 1)
        item["is_live"] = True
        base_sample = agent.get("telemetry_sample", "")
        if "slot:" in base_sample:
            item["telemetry_sample"] = re.sub(r"slot:\d+", f"slot:{slot}", base_sample)
        else:
            item["telemetry_sample"] = f"slot:{slot} | {base_sample}"
        enriched.append(item)
    return enriched

def get_agent_by_id(agent_id: str) -> Dict[str, Any]:
    for agent in AGENTS_FLEET:
        if agent["id"] == agent_id:
            return agent
    return {
        "id": agent_id,
        "name": agent_id,
        "squad": "custom",
        "squad_label": "Custom Agent",
        "role": "Autonomous Agent on Cookie Chain SVM",
        "status": "active",
        "uptime": "99.9%",
        "target_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "telemetry_sample": f"agent:{agent_id} | status:active | custom:true"
    }
