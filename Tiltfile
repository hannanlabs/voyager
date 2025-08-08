# Frontend service (build from root for workspace support)
docker_build('frontend', '.', dockerfile='apps/frontend/Dockerfile')
k8s_yaml('deployments/frontend/dev/local.yaml')
k8s_resource('frontend', port_forwards='3000:3000')

# Simulator service
docker_build('simulator', 'apps/simulator')
k8s_yaml('deployments/simulator/dev/local.yaml')
k8s_resource('simulator', port_forwards='8080:8080')

# Controller service (includes CRDs in local.yaml)
docker_build('controller', 'apps/controller')
k8s_yaml('deployments/controller/dev/local.yaml')

# Group controller resources
k8s_resource(
    new_name='controller-crds',
    objects=[
        'voyager-system:namespace',
        'flights.voyager.dev:customresourcedefinition',
    ]
)

k8s_resource(
    new_name='controller-rbac', 
    objects=[
        'voyager-controller-manager:serviceaccount',
        'voyager-controller-manager-role:clusterrole',
        'voyager-controller-leader-election-role:role',
        'voyager-controller-manager-rolebinding:clusterrolebinding',
        'voyager-controller-leader-election-rolebinding:rolebinding',
    ]
)

k8s_resource('controller', port_forwards='8081:8081')