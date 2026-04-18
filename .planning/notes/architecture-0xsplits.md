---
title: "Architecture Decision: 0xSplits"
date: "2026-04-17"
context: "Exploring backend architecture for mutable payment splitting"
---

# Architecture Decision: 0xSplits

We are building a dual-module (Admin + Creator) Web3 dashboard for revenue and rights tracking using MetaMask. The protocol must automatically catch secondary royalties and direct Web3 sales from sources like NFT marketplaces without manual deposits.

Admins need the ability to dynamically adjust the revenue split percentages (e.g., if a new creator joins midway). However, custom payment splitters (like OpenZeppelin's standard) run into strict constraints handling historical balances when split percentages change. If not done perfectly, changes to splits can retroactively alter unclaimed funds for existing creators.

Instead of writing a custom contract to "flush" and recalculate historical balances manually before updates, we will integrate **0xSplits**. 0xSplits is a battle-tested, modular protocol explicitly designed for mutable Web3 accounting and dynamic routing, which significantly de-risks the smart contract layer of our product.
