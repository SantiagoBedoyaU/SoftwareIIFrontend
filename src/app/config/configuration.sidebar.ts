export interface MenuItem {
    route: string;
    name: string;
    icon: string;
}

export const MENU_ROLES: Record<number, MenuItem[] >  = {
    0: [ // 0: Administrador
        { route: '/user/get-personal-data', name: 'Mis datos personales', icon: 'folder_shared' },
        { route: '/security/password-change', name: 'Cambiar contraseña', icon: 'vpn_key' },
        { route: '/security/assignRole', name: 'Asignar roles', icon: 'assignment_ind' },
        { route: '/security/adminRegistration', name: 'Registrar administrador', icon: 'person_add' },
    ],
    1: [ // 1: Médico/auxiliar
        { route: '/user/get-personal-data', name: 'Mis datos personales', icon: 'folder_shared' },
        { route: '/security/password-change', name: 'Cambiar contraseña', icon: 'vpn_key' },
        { route: '/appointment/consultHours', name: 'Consultar horario', icon: 'event'},
        { route: 'security/patientDoctorRegistration', name: 'Registrar usuario', icon: 'person_add' },
        { route: '/appointment/addNewHistory', name: 'Añadir historial clínico', icon: 'add_to_photos' },
        { route: '/appointment/viewHistoryForPhysician', name: 'Ver historial clínico', icon: 'history' },
    ],
    2: [ // 2: Paciente
        { route: '/user/get-personal-data', name: 'Mis datos personales', icon: 'folder_shared' },
        { route: '/security/password-change', name: 'Cambiar contraseña', icon: 'vpn_key' },
        { route: '/appointment/addAppointment', name: 'Solicitar cita', icon: 'event_available' },
        { route: '/appointment/cancelAppointment', name: 'Cancelar cita', icon: 'event_busy' },
    ],
};