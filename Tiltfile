
k8s_yaml('deployments/dev')

if os.path.exists('apps/frontend/Dockerfile'):
    docker_build('voyager-frontend', 'apps/frontend')

if os.path.exists('apps/controller/Dockerfile'):
    docker_build('voyager-controller', 'apps/controller')

if os.path.exists('apps/simulator/Dockerfile'):
    docker_build('voyager-simulator', 'apps/simulator')

allow_k8s_contexts('kind-*', 'k3d-*')

