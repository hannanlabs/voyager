# Frontend service
docker_build('frontend', 'apps/frontend')
k8s_yaml('deployments/frontend/dev/local.yaml')
k8s_resource('frontend', port_forwards='3000:3000')