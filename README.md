# Voyager Monorepo Scaffold

This repository is **only the high-level skeleton**.  Real code, charts and manifests will be added incrementally.

```
voyager/
├── apps/                  # runnable containers (one dir == one image)
│   ├── frontend/          # Next.js 14 UI – empty placeholder for now
│   ├── controller/        # Go Kubebuilder controller
│   └── simulator/         # Go/Rust flight physics job
│        Dockerfile  chart/  src/|cmd/ will live here later
│
├── packages/              # shared code & generated assets
│   ├── proto/             # protobuf + Buf configs
│   ├── shared-go/         # Go helper libraries
│   └── shared-ts/         # TypeScript utilities
│
├── infrastructure/        # cluster-agnostic IaC
│   ├── terraform/         # modules/  envs/
│   └── helm-charts/       # umbrella + sub-charts
│
├── deployments/           # GitOps overlays (dev / staging / prod)
│
├── Tiltfile               # local dev orchestration (kind/k3d + live reload)
└── .github/               # CI pipelines (to be added)
```

Design references:
* Go & TS monorepo layout – [Nvos/gomonorepo](https://github.com/Nvos/gomonorepo)
* Terraform standard module structure – [HashiCorp docs](https://developer.hashicorp.com/terraform/language/modules/develop/structure)
* Helm chart best-practices – [Helm v3 guide](https://v3.helm.sh/docs/chart_best_practices/)
* GitOps app-of-apps structure – [Stakater blog](https://www.stakater.com/post/gitops-repository-structure)

> Only create new sub-folders when code demands it – flat first, then refine.
