# Changelog

## [1.0.1](https://github.com/rchrdkvcs/gitify/compare/v1.0.0...v1.0.1) (2026-05-21)


### Corrections

* await serialization in auth controller ([f2b113f](https://github.com/rchrdkvcs/gitify/commit/f2b113f81b89bfe60fb8cc4471340341ffe58cea))
* normalize languages to lowercase in preferences handling and validation ([82d0be5](https://github.com/rchrdkvcs/gitify/commit/82d0be5a71f75b62898e43fdc9babe8068754928))
* remove redundant ApiParam decorators for project ID in controller ([9d89e24](https://github.com/rchrdkvcs/gitify/commit/9d89e24113ed977a348742ad92e31ec93c5d9b0b))
* update project ID type from number to string for consistency in project interactions ([5d83f65](https://github.com/rchrdkvcs/gitify/commit/5d83f6548d19e5384d3ad57f38eb49a3bcab8d7c))
* update project ID validation to enforce string format and regex pattern ([8946f95](https://github.com/rchrdkvcs/gitify/commit/8946f956ab730af695878f2acbb3ea6980eb5ac5))


### Maintenance

* add ignorePatterns for CHANGELOG.md in oxfmt.config.ts ([3c42287](https://github.com/rchrdkvcs/gitify/commit/3c42287fc9d30ae4c067503b83236ac9fd80b107))
* update ignorePatterns format in oxfmt.config.ts ([24735b1](https://github.com/rchrdkvcs/gitify/commit/24735b1518f8c3749216c9d70420ff277f0f8579))
* update workflow triggers to remove pull_request event from oxfmt.yml and oxlint.yml ([5259447](https://github.com/rchrdkvcs/gitify/commit/5259447b1509325424adbd3fc55260819fb0e0e5))

## 1.0.0 (2026-05-20)


### Nouveautés

* add init hook to index entities in adonisrc configuration ([ef9f70f](https://github.com/rchrdkvcs/gitify/commit/ef9f70fd369a8f3947b70ca25772b75eb5b61167))
* add OXFmt and OXLint configuration files for CI workflow ([54b6d3e](https://github.com/rchrdkvcs/gitify/commit/54b6d3ebb47c3d2fdec6575826f97d7ae80df993))
* add OXFmt and OXLint configuration files for CI workflow ([76b0f6c](https://github.com/rchrdkvcs/gitify/commit/76b0f6cfd978cb745e12693e1b3b356e6dee4092))
* add oxfmt configuration and update package dependencies ([362c358](https://github.com/rchrdkvcs/gitify/commit/362c358cc1171f8bc96bd5d15412c46844a8eab2))
* add oxfmt configuration and update package dependencies ([05a030d](https://github.com/rchrdkvcs/gitify/commit/05a030d9c00578cc75d440716bee741a898e6991))
* add project table ([71f7ccb](https://github.com/rchrdkvcs/gitify/commit/71f7ccb17e00df33091e475ecb388c8c15410505))
* add project table ([5e16a5b](https://github.com/rchrdkvcs/gitify/commit/5e16a5bbfb4b75ea734efd381d8fc703d0c2c42f))
* add release configuration files for automated versioning and changelog generation ([c905bf8](https://github.com/rchrdkvcs/gitify/commit/c905bf80b38a26ecbe451fcf38f9522f57174e56))
* add release configuration files for automated versioning and changelog generation ([65bb0b5](https://github.com/rchrdkvcs/gitify/commit/65bb0b5a29911a810c779f466f12d77cad3172c6))
* add table favorites ([b8599be](https://github.com/rchrdkvcs/gitify/commit/b8599be77ff1247c3981677862170c37d5cbfe48))
* add user table ([93938e4](https://github.com/rchrdkvcs/gitify/commit/93938e4d0c69882480903dc5d111a3e951f138c6))
* add user table ([dff62aa](https://github.com/rchrdkvcs/gitify/commit/dff62aa1a08c0190cbe8b840b5549c164ff28d10))
* add user table ([9557706](https://github.com/rchrdkvcs/gitify/commit/955770672feb8ad4868ac21617bc42151d40a943))
* **api,web:** add pagination to liked projects ([637f137](https://github.com/rchrdkvcs/gitify/commit/637f1372b3050070a816efa0a5b92d7c589404cd))
* **api:** add project matching engine with github lazy fetching and round robin feed ([86a632e](https://github.com/rchrdkvcs/gitify/commit/86a632eca26a7cba7b40dd12ede28d6ecb9947cc))
* **api:** add project/{id} to get all the details of an repo ([9e5b3cf](https://github.com/rchrdkvcs/gitify/commit/9e5b3cf44dd3e31d67aa6b064a92eac49e4627be))
* **api:** improuve fetching repo in async by language ([e198864](https://github.com/rchrdkvcs/gitify/commit/e1988640fc694304a0e9f9893d838f9ad6b044c0))
* **api:** improuve security on /dev ([39cfc72](https://github.com/rchrdkvcs/gitify/commit/39cfc728f27fe81410f6b35bfed0a00cf8e3c72c))
* auth github ([15bab80](https://github.com/rchrdkvcs/gitify/commit/15bab80e6e29de7116f5092d562e54f64e871deb))
* **auth:** implement authentication middleware and user store management ([bf2d702](https://github.com/rchrdkvcs/gitify/commit/bf2d70291495c2db6e0f7bb4eb1af090a9169bf9))
* **auth:** implement GitHub OAuth with HTTP-Only opaque tokens ([ddf847b](https://github.com/rchrdkvcs/gitify/commit/ddf847b63514f248fa94edf7b6b20c53bc7692c5))
* **bdd:** remplacer les identifiants auto-incrémentés par des ulid ([464c0df](https://github.com/rchrdkvcs/gitify/commit/464c0dfdd11bd55a63e183fb57914170b0015e6e))
* **bdd:** remplacer les identifiants auto-incrémentés par des ulid ([7f4efc4](https://github.com/rchrdkvcs/gitify/commit/7f4efc4f8374f871dbf1dc4f2db1dc4ddab3147e))
* create global configuration for GitHub API client and services ([ee30898](https://github.com/rchrdkvcs/gitify/commit/ee30898ebb2413c856ca17f7e8dbe4d6c959ad64))
* create global configuration for GitHub API client and services ([afeb4ae](https://github.com/rchrdkvcs/gitify/commit/afeb4ae49baec575f95c45b2537c2961eec3391b))
* **deploy:** ajouter workflow de déploiement et de création de brouillon de version ([39fa273](https://github.com/rchrdkvcs/gitify/commit/39fa273170478bc2d265b76967d25b250cacf6dd))
* **deploy:** ajouter workflow de déploiement et de création de brouillon de version ([04e50d3](https://github.com/rchrdkvcs/gitify/commit/04e50d3b8a906e58e537e556299bf2e12c0c86a9))
* generate AdonisJS client and server files for routes, models, controllers, and schemas ([136e725](https://github.com/rchrdkvcs/gitify/commit/136e72583b9cc6c00849bfea849d4f5b35b9252e))
* integrate shared types package for improved type definitions across components ([feaa89a](https://github.com/rchrdkvcs/gitify/commit/feaa89aff842950b93c152c8fee49411c84ee3d9))
* integrate shared types package for improved type definitions across components ([fcfb9ea](https://github.com/rchrdkvcs/gitify/commit/fcfb9ea836d608b7ed7bb03cb14fcf439971d22d))
* **landing:** ajouter la structure de la page d'accueil avec en-tête et pied de page ([dec6be0](https://github.com/rchrdkvcs/gitify/commit/dec6be0bd9d29cea399708a2add7ba85cda0c4b5))
* **landing:** ajouter la structure de la page d'accueil avec en-tête et pied de page ([4580f51](https://github.com/rchrdkvcs/gitify/commit/4580f5139b28751b3bc579581a0b433278fa3524))
* **onboarding:** implement user profiling and preferences ([40418b1](https://github.com/rchrdkvcs/gitify/commit/40418b1eabfab5617cc43e3036dc121138fb7a53))
* **project:** add total number of forks and contributors and latest … ([f6d9a53](https://github.com/rchrdkvcs/gitify/commit/f6d9a53b67a6108cd9e02583e051f1481b095e26))
* **project:** add total number of forks and contributors and latest release ([c4f4d0f](https://github.com/rchrdkvcs/gitify/commit/c4f4d0fa39251be645202727e738d9ee9a9efb59))
* refactor authentication routes to use generated controllers ([3c42629](https://github.com/rchrdkvcs/gitify/commit/3c42629660a4d1148f82f6845f27e1bd1858287a))
* update authentication configuration and add GitHub OAuth support ([d02ea31](https://github.com/rchrdkvcs/gitify/commit/d02ea313c6627cf5faf53705001d8db858ae18ff))
* update project migration and model ([ff110fc](https://github.com/rchrdkvcs/gitify/commit/ff110fc93de298baeb6502606a66321fb5a41a84))
* **web:** add swipe and liked pages with project card ui ([df32fa3](https://github.com/rchrdkvcs/gitify/commit/df32fa39b2fc32f6999908fcfbf8c5d8723157df))
* **web:** create the detail page ([01bb01c](https://github.com/rchrdkvcs/gitify/commit/01bb01cea9e152ed21a6db30865d77ea61c1be2c))


### Corrections

* **api:** fix copilote review ([3c57103](https://github.com/rchrdkvcs/gitify/commit/3c57103b5e05c87489ddf664ed973a460edb1d68))
* **auth:** refactor authentication logic and update API URL configuration ([4cb7cdd](https://github.com/rchrdkvcs/gitify/commit/4cb7cddf8dfb32f9de1c4fe1d77af6a26fc25b2a))
* **auth:** update authentication plugin to use new API structure and enhance package build configuration ([1e722c6](https://github.com/rchrdkvcs/gitify/commit/1e722c6a99065495b1ce359ecd892a4235e3c5e6))
* **project:** add random project on landing page ([8382809](https://github.com/rchrdkvcs/gitify/commit/83828098b0a89ef69b4e35d6a80032cc65d0fda0))
* update user model to use default column names ([7b39a94](https://github.com/rchrdkvcs/gitify/commit/7b39a94ea86e7573081eb438064f5bc8945241e0))
* update user model to use default column names ([0572ef0](https://github.com/rchrdkvcs/gitify/commit/0572ef00413ca0e4332a59a1e5712afe2cdcc088))


### Performance

* **nuxt:** reorganize nuxt.config.ts and optimize dependencies for improved performance ([c8e8662](https://github.com/rchrdkvcs/gitify/commit/c8e86622fd08fdc4f30ab49bb0890504b750038d))


### Refactorisation

* **api:** prallelize GitHub repo storage ([30311d6](https://github.com/rchrdkvcs/gitify/commit/30311d634b13c84468a869fec6024c3c88a5e256))
* **api:** remove unsed AdonisJS boilerplate ([7e96be9](https://github.com/rchrdkvcs/gitify/commit/7e96be9a6eb7143a7c2ce5ca6f645d6d9887f787))
* **api:** remove unused AdonisJS boilerplate ([871414b](https://github.com/rchrdkvcs/gitify/commit/871414b34d0b47881b902c669b1c39dd4f61d5be))
* **api:** rename accessToken to githubAccessToken on User ([be77d4b](https://github.com/rchrdkvcs/gitify/commit/be77d4babf914de72dfaf22034e2f02794c387c9))
* **api:** replace interactionValidator with projectIdValidator ([94a89fc](https://github.com/rchrdkvcs/gitify/commit/94a89fc20b32fce70bb107922cafeed0d3f087dd))
* **auth:** améliorer la gestion des utilisateurs avec useApi ([830f895](https://github.com/rchrdkvcs/gitify/commit/830f89549bf93300ae8fe03d2a4508442274919a))
* **auth:** extract business logic from controllers into services ([a17e718](https://github.com/rchrdkvcs/gitify/commit/a17e7183d725ce9fec54207cd08463ec93d9411b))
* **auth:** extract business logic from controllers into services ([78c9184](https://github.com/rchrdkvcs/gitify/commit/78c91848955fb61e101a57a38c185f52ed3034d8))
* **core:** remove unused favorite model and health boilerplate ([cf750ce](https://github.com/rchrdkvcs/gitify/commit/cf750ce9e1fe98ae261358c2b507af34232f1a55))
* **db:** consolidate project colums into base migration ([1bb2d17](https://github.com/rchrdkvcs/gitify/commit/1bb2d1710312448e3fb12ba81345b183e62dfe24))
* **modèles:** alignement de la gestion des models vers adonis 7 ([d043358](https://github.com/rchrdkvcs/gitify/commit/d043358e24bd881d6ea745a51fceaac984c7ce1f))
* **modèles:** alignement de la gestion des models vers adonis 7 ([6aa15e2](https://github.com/rchrdkvcs/gitify/commit/6aa15e2b75f7a684c346eed4f654b48d9769e0e8))
* **web:** extract business logic into composables and replace FetchWrapper with useHttp ([48460c4](https://github.com/rchrdkvcs/gitify/commit/48460c41cfd079c10eae18a7206cf3323080f209))


### Maintenance

* add ally ([97480e7](https://github.com/rchrdkvcs/gitify/commit/97480e7c052a22118050bc6af6d4848af2f58337))
* **api:** migrate from v6 to v7 ([8bf2e75](https://github.com/rchrdkvcs/gitify/commit/8bf2e75e5fb53b9c04d988a22c390a8d3e2263a4))
* **api:** migrate from v6 to v7 ([accf0f3](https://github.com/rchrdkvcs/gitify/commit/accf0f34a612b1683309036a27132bdea855e0de))
* **deps:** bump pnpm to 10.33.2 ([3a2ebb1](https://github.com/rchrdkvcs/gitify/commit/3a2ebb1d6c35b9df38a0e33c0a8cb1732df62406))
* **dev-tools:** add commitizen configuration for conventional commits ([5df497a](https://github.com/rchrdkvcs/gitify/commit/5df497a9d7c8ab4dbff6a18dbac762b7ca7f6cfb))
* **docker:** pre-create Nuxt cache dirs with correct ownership ([26131ce](https://github.com/rchrdkvcs/gitify/commit/26131ceb610a5181bf0449d1c4306541bcb1f247))
* **docker:** update docker compose dev configuration ([3d73962](https://github.com/rchrdkvcs/gitify/commit/3d739620d94d422d1ec58f0d8413677022063c8e))
* fmt ([217c684](https://github.com/rchrdkvcs/gitify/commit/217c68430cfab3a1b9504015cc73b1a2f7ffa73b))
* format ([6b90849](https://github.com/rchrdkvcs/gitify/commit/6b90849c784c2b1d1dd0f976649687b9587c56e3))
* lint & fmt ([81c1917](https://github.com/rchrdkvcs/gitify/commit/81c1917b4c789810034c6564153f0dd1eda5e701))
* lint & format ([b5df84e](https://github.com/rchrdkvcs/gitify/commit/b5df84eb3c38808348116ef263b83585d1ea8114))
* lint and format ([51039bc](https://github.com/rchrdkvcs/gitify/commit/51039bcf4581cb483b69250e4b826764bbfe5510))
* **migration:** mettre à jour les commandes de formatage et de linting ([f7310db](https://github.com/rchrdkvcs/gitify/commit/f7310dbdfbac26d19371febd95c779e7cbaf61ef))
* **migration:** mettre à jour les commandes de linting et de formatage ([0bfcb7a](https://github.com/rchrdkvcs/gitify/commit/0bfcb7ac740b0aaf84bcde536196189eeb42aa7c))
* **migration:** migrer vers turbo et mettre à jour les fichiers de configuration ([e79939a](https://github.com/rchrdkvcs/gitify/commit/e79939a3d358e83a940790ec43cece91bf7650a4))
* **migration:** migrer vers turbo et mettre à jour les fichiers de configuration ([bd4be17](https://github.com/rchrdkvcs/gitify/commit/bd4be1737a57079da4d140cc128766b92a684756))
* project setup with aduxt starter kit ([9e51f05](https://github.com/rchrdkvcs/gitify/commit/9e51f0583eec99fa9df203f45fb7e5cbddf05c27))
* rename project to gitify and update dependencies ([f46c6d5](https://github.com/rchrdkvcs/gitify/commit/f46c6d5e4800d1a281965b23c62b1cf9f8cf6c6d))
* update Dockerfile to use Node.js and pnpm for dependency management ([f8dac36](https://github.com/rchrdkvcs/gitify/commit/f8dac36931ba3d40ba1ae11438107fc1bd4a7e59))
* update environment variables and add Docker support for development ([dddeecc](https://github.com/rchrdkvcs/gitify/commit/dddeecc5dac9135feaeb40057c0f3b5bbdb2098f))
* update imports to use type syntax and add oxlint configuration ([687fe82](https://github.com/rchrdkvcs/gitify/commit/687fe82e266d2c64024e79bee3644a42000d6874))
* update imports to use type syntax and add oxlint configuration ([d6e6959](https://github.com/rchrdkvcs/gitify/commit/d6e69597ca78c7286059f1405a63489d33b5dd35))
* update package.json to specify pnpm version ([c7701b1](https://github.com/rchrdkvcs/gitify/commit/c7701b1a39327167c03970c8433a1940797b7dad))
* **web:** add marked, dompurify and tailwindcss/typography to diplay markdown properly ([693af0e](https://github.com/rchrdkvcs/gitify/commit/693af0e113b84a96c8f748fe6b15222811cc5209))
* **web:** migrate nuxt version and created custom useFetch ([50af8c4](https://github.com/rchrdkvcs/gitify/commit/50af8c45d8a5feac0adc75cd99b6aad7226cf851))
* **web:** migrate nuxt version and created custom useFetch ([1488f55](https://github.com/rchrdkvcs/gitify/commit/1488f550bf334500ad341222ec8a8d659262b9d9))


### Documentation

* add IA instruction ([bd4bfff](https://github.com/rchrdkvcs/gitify/commit/bd4bffff1935b415657852a179392ed8c34c9430))
* add IA instruction ([5de0ccc](https://github.com/rchrdkvcs/gitify/commit/5de0ccc83ec2d732e4861d067a72a8c4fad903a0))
* fix PostgreSQL spelling in architecture.md ([c7ba0bb](https://github.com/rchrdkvcs/gitify/commit/c7ba0bb9be4ef8ff8b69d84c6d9f16932215872a))
* **openapi:** integrate OpenAPI documentation and routes for API endpoints ([e7478ca](https://github.com/rchrdkvcs/gitify/commit/e7478ca26149aa062112b896ec1d371ff6253811))
* **openapi:** integrate OpenAPI documentation and routes for API endpoints ([9cb3fd4](https://github.com/rchrdkvcs/gitify/commit/9cb3fd435712ebf38c8c1bc6af994430bb3d3837))
* **project:** add architecture and contributing documentation ([d2fd812](https://github.com/rchrdkvcs/gitify/commit/d2fd812938a0541753454216e3fb806b962476ea))
* update architecture and product documentation for authentication flow and session management ([1cc7b4c](https://github.com/rchrdkvcs/gitify/commit/1cc7b4c900920dd9b18017ebbed7daad91b8adb8))
* update contributing guidelines and project documentation ([78e597e](https://github.com/rchrdkvcs/gitify/commit/78e597e6a3f5f95c6695a42acac64949246b6a8f))
* update monorepo paths from /backend,/frontend to apps/api,apps/web ([36bd030](https://github.com/rchrdkvcs/gitify/commit/36bd030437f87f6c2f423742799791fb0805f204))
