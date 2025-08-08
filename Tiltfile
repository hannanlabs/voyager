# Frontend service (build from root for workspace support)
docker_build('frontend', '.', dockerfile='apps/frontend/Dockerfile')
k8s_yaml('deployments/frontend/dev/local.yaml')
k8s_resource('frontend', port_forwards='3000:3000')

# Simulator service (build from root for shared-go access)
docker_build('simulator', '.', dockerfile='apps/simulator/Dockerfile')
k8s_yaml('deployments/simulator/dev/local.yaml')
k8s_resource('simulator', port_forwards='8080:8080')

